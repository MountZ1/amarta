import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/database";
import { cities, districts, provinces } from "@/database/schema/schema";
import { rajaOngkirGet } from "@/lib/rajaOngkir";

const querySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("provinces") }),
  z.object({
    type: z.literal("cities"),
    provinceId: z.coerce.number().int().positive(),
  }),
  z.object({
    type: z.literal("districts"),
    cityId: z.coerce.number().int().positive(),
  }),
]);

type ExternalLocation = {
  id: number | string;
  name: string;
  province_id?: number | string;
  city_id?: number | string;
};

async function upsertLocations(
  kind: "provinces" | "cities" | "districts",
  rows: ExternalLocation[],
  parentId?: number,
) {
  const cleanRows = rows
    .filter((row) => row.id !== undefined && row.name?.trim())
    .map((row) => ({
      externalId: String(row.id),
      name: row.name.trim(),
    }));

  if (kind === "provinces") {
    if (cleanRows.length) {
      await db
        .insert(provinces)
        .values(cleanRows)
        .onConflictDoUpdate({
          target: provinces.externalId,
          set: { name: sql`excluded.name`, updatedAt: new Date() },
        });
    }
    return db.select().from(provinces).orderBy(provinces.name);
  }

  if (kind === "cities") {
    if (parentId === undefined) throw new Error("ID provinsi tidak valid");
    const values = rows
      .filter((row) => row.id !== undefined && row.name?.trim())
      .map((row) => ({
        externalId: String(row.id),
        provinceId: parentId,
        name: row.name.trim(),
      }));
    if (values.length) {
      await db
        .insert(cities)
        .values(values)
        .onConflictDoUpdate({
          target: cities.externalId,
          set: {
            provinceId: parentId,
            name: sql`excluded.name`,
            updatedAt: new Date(),
          },
        });
    }
    return db
      .select()
      .from(cities)
      .where(eq(cities.provinceId, parentId))
      .orderBy(cities.name);
  }

  if (parentId === undefined) throw new Error("ID kota tidak valid");
  const values = rows
    .filter((row) => row.id !== undefined && row.name?.trim())
    .map((row) => ({
      externalId: String(row.id),
      cityId: parentId,
      name: row.name.trim(),
    }));
  if (values.length) {
    await db
      .insert(districts)
      .values(values)
      .onConflictDoUpdate({
        target: districts.externalId,
        set: {
          cityId: parentId,
          name: sql`excluded.name`,
          updatedAt: new Date(),
        },
      });
  }
  return db
    .select()
    .from(districts)
    .where(eq(districts.cityId, parentId))
    .orderBy(districts.name);
}

export async function GET(req: NextRequest) {
  const rawQuery = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter lokasi tidak valid", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const query = parsed.data;
    if (query.type === "provinces") {
      const cached = await db.select().from(provinces).orderBy(provinces.name);
      if (cached.length) return NextResponse.json({ locations: cached });
      const external = await rajaOngkirGet<ExternalLocation[]>(
        "/destination/province",
      );
      return NextResponse.json({
        locations: await upsertLocations("provinces", external),
      });
    }

    if (query.type === "cities") {
      const [province] = await db
        .select()
        .from(provinces)
        .where(eq(provinces.id, query.provinceId))
        .limit(1);
      if (!province) {
        return NextResponse.json(
          { error: "Provinsi tidak ditemukan" },
          { status: 404 },
        );
      }

      const cached = await db
        .select()
        .from(cities)
        .where(eq(cities.provinceId, province.id))
        .orderBy(cities.name);
      if (cached.length) return NextResponse.json({ locations: cached });

      const external = await rajaOngkirGet<ExternalLocation[]>(
        `/destination/city/${encodeURIComponent(province.externalId)}`,
      );
      return NextResponse.json({
        locations: await upsertLocations("cities", external, province.id),
      });
    }

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, query.cityId))
      .limit(1);
    if (!city) {
      return NextResponse.json(
        { error: "Kota tidak ditemukan" },
        { status: 404 },
      );
    }

    const cached = await db
      .select()
      .from(districts)
      .where(eq(districts.cityId, city.id))
      .orderBy(districts.name);
    if (cached.length) return NextResponse.json({ locations: cached });

    const external = await rajaOngkirGet<ExternalLocation[]>(
      `/destination/district/${encodeURIComponent(city.externalId)}`,
    );
    return NextResponse.json({
      locations: await upsertLocations("districts", external, city.id),
    });
  } catch (error) {
    console.error("Fetch shipping locations error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar lokasi pengiriman" },
      { status: 502 },
    );
  }
}
