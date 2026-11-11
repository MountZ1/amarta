import { sql } from "drizzle-orm";
import { db } from "../index";
import { expeditions } from "../schema/schema";

export const EXPEDITIONS = [
  { code: "jne", name: "JNE" },
  { code: "sicepat", name: "SiCepat" },
  { code: "ide", name: "ID Express" },
  { code: "sap", name: "SAP Express" },
  { code: "jnt", name: "J&T Express" },
  { code: "ninja", name: "Ninja Xpress" },
  { code: "tiki", name: "TIKI" },
  { code: "lion", name: "Lion Parcel" },
  { code: "anteraja", name: "AnterAja" },
  { code: "pos", name: "POS Indonesia" },
  { code: "ncs", name: "Nusantara Card Semesta (NCS)" },
  { code: "rex", name: "Royal Express Indonesia (REX)" },
  { code: "rpx", name: "RPX" },
  { code: "sentral", name: "Sentral Cargo" },
  { code: "star", name: "Star Cargo" },
  { code: "wahana", name: "Wahana Prestasi Logistik" },
];

await db
  .insert(expeditions)
  .values(EXPEDITIONS)
  .onConflictDoUpdate({
    target: expeditions.code,
    set: { name: sql`excluded.name`, updatedAt: new Date() },
  });

console.log(`Ekspedisi: ${EXPEDITIONS.length} data di-upsert`);
process.exit(0);
