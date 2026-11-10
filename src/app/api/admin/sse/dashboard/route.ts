import { NextRequest } from "next/server";
import { db } from "@/database";
import { orders, orderItems, products } from "@/database/schema/schema";
import { and, gte, lte, desc, asc, sql, eq, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const startDate = startStr ? new Date(startStr) : null;
  const endDate = endStr ? new Date(`${endStr}T23:59:59.999Z`) : null;

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let isActive = true;

  async function fetchMetrics() {
    const conditions = [];
    if (startDate) {
      conditions.push(gte(orders.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(orders.createdAt, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 1. Total sales count & total revenue
    const revenueWhere = whereClause
      ? and(whereClause, ne(orders.status, "cancelled"))
      : ne(orders.status, "cancelled");

    const [salesStat] = await db
      .select({
        totalSales: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      })
      .from(orders)
      .where(revenueWhere);

    // 2. Top selling product
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalQuantity: sql<number>`sum(${orderItems.quantity})::int`,
        totalSalesAmount: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(revenueWhere)
      .groupBy(orderItems.productId, products.name)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(1);

    const topProduct = topProducts[0] || null;

    // 3. 5 latest orders
    const latestOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    // 4. 5 products with lowest stock
    const lowestStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        stock: products.stock,
        origin: products.origin,
        price: products.price,
      })
      .from(products)
      .orderBy(asc(products.stock))
      .limit(5);

    return {
      totalSales: salesStat?.totalSales || 0,
      totalRevenue: salesStat?.totalRevenue || 0,
      topProduct,
      latestOrders,
      lowestStockProducts,
      timestamp: new Date().toISOString(),
    };
  }

  (async () => {
    try {
      while (isActive) {
        const data = await fetchMetrics();
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch {
      isActive = false;
    } finally {
      try {
        await writer.close();
      } catch {}
    }
  })();

  req.signal.addEventListener("abort", () => {
    isActive = false;
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
