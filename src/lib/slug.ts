import { db } from "@/database";
import { products } from "@/database/schema/schema";
import { eq, and, ne } from "drizzle-orm";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-+/, "") // trim - from start of text
    .replace(/-+$/, ""); // trim - from end of text
}

export async function generateUniqueSlug(
  name: string,
  excludeId?: number
): Promise<string> {
  const baseSlug = slugify(name) || "produk";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const condition = excludeId
      ? and(eq(products.slug, slug), ne(products.id, excludeId))
      : eq(products.slug, slug);

    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(condition)
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
