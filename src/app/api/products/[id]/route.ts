import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { products } from "@/database/schema/schema";
import { eq } from "drizzle-orm";
import { productSchema } from "@/lib/validations";
import { generateUniqueSlug } from "@/lib/slug";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
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
      { error: "Gagal mengambil produk", message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const { name, description, origin, variety, price, stock, imageUrl } =
      parsed.data;

    let slug = existing.slug;
    if (name !== existing.name) {
      slug = await generateUniqueSlug(name, productId);
    }

    const [updated] = await db
      .update(products)
      .set({
        name,
        slug,
        description,
        origin,
        variety,
        price,
        stock,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate produk", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, productId));

    return NextResponse.json({ success: true, message: "Produk berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus produk", message: error.message },
      { status: 500 }
    );
  }
}
