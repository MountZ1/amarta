import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { expeditions } from "@/database/schema/schema";

export async function GET() {
  try {
    const availableExpeditions = await db
      .select({
        id: expeditions.id,
        code: expeditions.code,
        name: expeditions.name,
      })
      .from(expeditions)
      .where(eq(expeditions.isActive, true))
      .orderBy(expeditions.name);

    return NextResponse.json({ expeditions: availableExpeditions });
  } catch (error) {
    console.error("Fetch expeditions error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar kurir" },
      { status: 500 },
    );
  }
}
