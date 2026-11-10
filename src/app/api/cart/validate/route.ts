import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { products } from "@/database/schema/schema";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { calculateUnitPrice, CoffeeWeight, GrindSize, GRIND_SIZES } from "@/lib/coffee";

const cartValidateSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      weight: z.union([
        z.literal(250),
        z.literal(500),
        z.literal(750),
        z.literal(1000),
      ]).default(1000),
      grindSize: z.enum(["fine", "medium", "coarse", "biji"]).default("biji"),
      quantity: z.number().int().positive(),
      selected: z.boolean().default(true),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cartValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format keranjang tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { items } = parsed.data;
    if (items.length === 0) {
      return NextResponse.json({ items: [], subtotal: 0, isValid: true });
    }

    const productIds = items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const quantityByProduct = new Map<number, number>();
    for (const item of items) {
      if (!item.selected) continue;
      quantityByProduct.set(
        item.productId,
        (quantityByProduct.get(item.productId) || 0) + item.quantity
      );
    }

    let subtotal = 0;
    let isValid = true;

    const validatedItems = items.map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod) {
        isValid = false;
        return {
          productId: item.productId,
          weight: item.weight,
          grindSize: item.grindSize,
          quantity: item.quantity,
          available: false,
          reason: "Produk sudah tidak tersedia",
        };
      }

      const requestedQuantity = item.selected
        ? quantityByProduct.get(item.productId) || item.quantity
        : item.quantity;
      const available = prod.stock >= requestedQuantity;
      if (!available) {
        isValid = false;
      }

      const weight = item.weight as CoffeeWeight;
      const grindSize = item.grindSize as GrindSize;
      const unitPrice = calculateUnitPrice(prod.price, weight);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      const grindMeta = GRIND_SIZES.find((g) => g.value === grindSize);

      return {
        productId: prod.id,
        name: prod.name,
        slug: prod.slug,
        origin: prod.origin,
        variety: prod.variety,
        basePricePerKg: prod.price,
        weight,
        grindSize,
        grindLabel: grindMeta ? grindMeta.label : grindSize,
        price: unitPrice,
        stock: prod.stock,
        imageUrl: prod.imageUrl,
        quantity: item.quantity,
        available,
        itemTotal,
      };
    });

    return NextResponse.json({
      items: validatedItems,
      subtotal,
      isValid,
    });
  } catch (error: any) {
    console.error("Cart validate error:", error);
    return NextResponse.json(
      { error: "Gagal memvalidasi keranjang", message: error.message },
      { status: 500 }
    );
  }
}
