import { sql } from "drizzle-orm";
import { db } from "../index";
import { provinces } from "../schema/schema";
import { rajaOngkirGet } from "@/lib/rajaOngkir";

type ApiProvince = { id: number; name: string };

const data = await rajaOngkirGet<ApiProvince[]>("/destination/province");

const rows = data.map((p) => ({
  externalId: String(p.id),
  name: p.name.trim(),
}));

await db
  .insert(provinces)
  .values(rows)
  .onConflictDoUpdate({
    target: provinces.externalId,
    set: { name: sql`excluded.name`, updatedAt: new Date() },
  });

console.log(`Provinsi: ${rows.length} data di-upsert`);
process.exit(0);
