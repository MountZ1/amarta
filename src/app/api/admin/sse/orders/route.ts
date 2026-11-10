import { NextRequest } from "next/server";
import { db } from "@/database";
import { orders } from "@/database/schema/schema";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  let isActive = true;

  async function fetchOrders() {
    const orderList = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(100);

    return {
      orders: orderList,
      timestamp: new Date().toISOString(),
    };
  }

  (async () => {
    try {
      while (isActive) {
        const data = await fetchOrders();
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
