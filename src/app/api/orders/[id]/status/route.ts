import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { orders, orderItems, products } from "@/database/schema/schema";
import { eq, sql } from "drizzle-orm";
import { orderStatusSchema } from "@/lib/validations";
import { canTransitionStatus, OrderStatus } from "@/lib/order-status";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
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

    const body = await req.json();
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Status tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const targetStatus = parsed.data.status as OrderStatus;

    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentStatus = currentOrder.status as OrderStatus;

    // Check transition rules
    if (!canTransitionStatus(currentStatus, targetStatus)) {
      return NextResponse.json(
        {
          error: `Transisi status tidak diperbolehkan dari "${currentStatus}" ke "${targetStatus}".`,
          rules: {
            pending: "Hanya boleh ke processing atau cancelled",
            processing: "Hanya boleh ke shipped",
            shipped: "Hanya boleh ke completed",
          },
        },
        { status: 400 }
      );
    }

    // If cancelled, restore stock
    if (targetStatus === "cancelled" && currentStatus !== "cancelled") {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      await db.transaction(async (tx) => {
        for (const item of items) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        }

        await tx
          .update(orders)
          .set({ status: targetStatus, updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      });
    } else {
      await db
        .update(orders)
        .set({ status: targetStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId));
    }

    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan", message: error.message },
      { status: 500 }
    );
  }
}
