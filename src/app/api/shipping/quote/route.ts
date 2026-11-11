import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/database";
import { districts, cities, provinces, expeditions } from "@/database/schema/schema";
import { rajaOngkirPost } from "@/lib/rajaOngkir";
import { signQuote } from "@/lib/quote";

const requestSchema = z.object({
  districtId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        weight: z.union([z.literal(250), z.literal(500), z.literal(750), z.literal(1000)]),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

type ProviderQuote = {
  name?: string;
  code?: string;
  service?: string;
  description?: string;
  cost?: number | { value?: number };
  value?: number;
  etd?: string | number;
};

interface SignedShippingQuote {
  version: 1;
  districtId: number;
  expeditionId: number;
  courierCode: string;
  service: string;
  cost: number;
  etd: string;
  weight: number;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data ongkir tidak valid", details: parsed.error.format() },
      { status: 400 },
    );
  }

  const { districtId, items } = parsed.data;
  const weight = items.reduce((total, item) => total + item.weight * item.quantity, 0);
  if (!Number.isSafeInteger(weight) || weight <= 0) {
    return NextResponse.json({ error: "Berat paket tidak valid" }, { status: 400 });
  }

  try {
    const originExternalId = process.env.RAJAONGKIR_ORIGIN_DISTRICT_ID;
    if (!originExternalId) {
      throw new Error("RAJAONGKIR_ORIGIN_DISTRICT_ID belum dikonfigurasi");
    }

    // 1. Kecamatan tujuan (beserta kota dan provinsi)
    const [destination] = await db
      .select({
        district: districts,
        city: cities,
        province: provinces,
      })
      .from(districts)
      .innerJoin(cities, eq(districts.cityId, cities.id))
      .innerJoin(provinces, eq(cities.provinceId, provinces.id))
      .where(eq(districts.id, districtId))
      .limit(1);
    if (!destination) {
      return NextResponse.json({ error: "Kecamatan tujuan tidak ditemukan" }, { status: 404 });
    }

    // 2. Semua kurir aktif dari database
    const activeCouriers = await db
      .select()
      .from(expeditions)
      .where(eq(expeditions.isActive, true));

    if (activeCouriers.length === 0) {
      return NextResponse.json({ error: "Kurir tidak tersedia" }, { status: 400 });
    }

    const courierByCode = new Map(activeCouriers.map((c) => [c.code, c]));

    // 3. Satu panggilan untuk semua kurir: courier=jne:sicepat:jnt:...
    const params = new URLSearchParams({
      origin: originExternalId,
      destination: destination.district.externalId,
      weight: String(weight),
      courier: activeCouriers.map((c) => c.code).join(":"),
    });

    const providerQuotes = await rajaOngkirPost<ProviderQuote[]>(
      "/calculate/district/domestic-cost",
      params,
    );

    if (!Array.isArray(providerQuotes)) {
      throw new Error("Format respons tarif RajaOngkir tidak valid");
    }

    // 4. Petakan tiap hasil ke ekspedisi di database, lalu tandatangani
    const quotes = providerQuotes
      .flatMap((quote) => {
        const courier = quote.code ? courierByCode.get(quote.code) : undefined;
        if (!courier) return []; // kode tidak dikenal atau tidak aktif

        const cost =
          typeof quote.cost === "number"
            ? quote.cost
            : typeof quote.cost?.value === "number"
              ? quote.cost.value
              : quote.value;
        if (typeof cost !== "number" || !Number.isSafeInteger(cost) || cost < 0 || !quote.service) {
          return [];
        }

        const payload: SignedShippingQuote = {
          version: 1,
          districtId,
          expeditionId: courier.id,
          courierCode: courier.code,
          service: quote.service,
          cost,
          etd: String(quote.etd ?? ""),
          weight,
        };

        return [
          {
            expeditionId: courier.id,
            courierCode: courier.code,
            courierName: courier.name,
            service: quote.service,
            description: quote.description || "",
            cost,
            etd: payload.etd,
            weight,
            token: signQuote(payload),
          },
        ];
      })
      .sort((a, b) => a.cost - b.cost);

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Calculate shipping quote error:", error);
    return NextResponse.json({ error: "Gagal menghitung ongkos kirim" }, { status: 502 });
  }
}
