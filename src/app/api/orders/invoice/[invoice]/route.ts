import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { orders, orderItems, products } from "@/database/schema/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoice: string }> }
) {
  try {
    const { invoice } = await params;
    if (!invoice || invoice.trim().length === 0) {
      return NextResponse.json(
        { error: "Nomor invoice harus diisi" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.invoice, invoice.trim()))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan dengan invoice ini tidak ditemukan" },
        { status: 404 }
      );
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        weight: orderItems.weight,
        grindSize: orderItems.grindSize,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: products.name,
        productSlug: products.slug,
        productOrigin: products.origin,
        productVariety: products.variety,
        productImageUrl: products.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json({ order, items });
  } catch (error: any) {
    console.error("Check invoice error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pesanan", message: error.message },
      { status: 500 }
    );
  }
}
