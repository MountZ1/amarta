import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { orders, orderItems, products } from "@/database/schema/schema";
import { orderCreateSchema } from "@/lib/validations";
import { generateInvoice } from "@/lib/invoice";
import { eq, inArray, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { calculateUnitPrice } from "@/lib/coffee";
import type { CoffeeWeight, GrindSize } from "@/lib/coffee";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = db.select().from(orders).orderBy(desc(orders.createdAt));

    const allOrders = status
      ? await query.where(eq(orders.status, status as any))
      : await query;

    return NextResponse.json({ orders: allOrders });
  } catch (error: any) {
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pesanan", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerName, phoneNumber, address, items } = parsed.data;

    // Fetch products to verify price and stock
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Check stock & calculate total
    let total = 0;
    const quantityByProduct = new Map<number, number>();
    for (const item of items) {
      quantityByProduct.set(
        item.productId,
        (quantityByProduct.get(item.productId) || 0) + item.quantity
      );
    }

    const verifiedItems: {
      productId: number;
      weight: CoffeeWeight;
      grindSize: GrindSize;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return NextResponse.json(
          { error: `Produk ID #${item.productId} tidak ditemukan` },
          { status: 400 }
        );
      }

      if (prod.stock < (quantityByProduct.get(item.productId) || item.quantity)) {
        return NextResponse.json(
          {
            error: `Stok produk "${prod.name}" tidak mencukupi (tersisa ${prod.stock})`,
          },
          { status: 400 }
        );
      }

      const itemPrice = calculateUnitPrice(prod.price, item.weight);
      total += itemPrice * item.quantity;
      verifiedItems.push({
        productId: prod.id,
        weight: item.weight,
        grindSize: item.grindSize,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    const invoice = generateInvoice();

    // Execute atomic transaction for order, items, and stock decrement
    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          invoice,
          customerName,
          phoneNumber,
          address,
          status: "pending",
          total,
        })
        .returning();

      for (const item of verifiedItems) {
        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          weight: item.weight,
          grindSize: item.grindSize,
          quantity: item.quantity,
          price: item.price,
        });

        // Decrement stock
        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        success: true,
        order: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pesanan", message: error.message },
      { status: 500 }
    );
  }
}
