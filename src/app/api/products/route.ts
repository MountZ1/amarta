import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { products } from "@/database/schema/schema";
import { productSchema } from "@/lib/validations";
import { generateUniqueSlug } from "@/lib/slug";
import { getSession } from "@/lib/auth";
import { ilike, or, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const name = searchParams.get("name")?.trim();
    const origin = searchParams.get("origin")?.trim();
    const variety = searchParams.get("variety")?.trim();

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.origin, `%${search}%`),
          ilike(products.variety, `%${search}%`)
        )
      );
    }
    if (name) {
      conditions.push(ilike(products.name, `%${name}%`));
    }
    if (origin) {
      conditions.push(ilike(products.origin, `%${origin}%`));
    }
    if (variety) {
      conditions.push(ilike(products.variety, `%${variety}%`));
    }

    const query = db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    const result =
      conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

    return NextResponse.json({ products: result });
  } catch (error: any) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, description, origin, variety, price, stock, imageUrl } =
      parsed.data;

    // generate slug in backend
    const slug = await generateUniqueSlug(name);

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        slug,
        description,
        origin,
        variety,
        price,
        stock,
        imageUrl,
      })
      .returning();

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Gagal membuat produk", message: error.message },
      { status: 500 }
    );
  }
}
