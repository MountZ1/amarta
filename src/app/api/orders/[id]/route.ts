import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { orders, orderItems, products } from "@/database/schema/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Fetch items with product details
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
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
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order, items });
  } catch (error: any) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pesanan", message: error.message },
      { status: 500 }
    );
  }
}
