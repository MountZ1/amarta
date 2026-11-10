import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { products } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug wajib diisi" }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Gagal mengambil data produk", message: error.message },
      { status: 500 }
    );
  }
}
