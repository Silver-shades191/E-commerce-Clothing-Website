import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendOrderConfirmationEmail } from "@/lib/email";

// Marks an order paid, decrements stock and bumps coupon usage. Idempotent:
// calling it twice for the same order does nothing the second time.
export async function fulfillOrder(orderId: string, paymentRef?: string) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order || order.status !== "pending") return { ok: false as const, reason: "not_pending" };

  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));

  await db.transaction(async (tx) => {
    const claimed = await tx
      .update(schema.orders)
      .set({ status: "paid", paymentRef: paymentRef ?? order.paymentRef })
      .where(and(eq(schema.orders.id, orderId), eq(schema.orders.status, "pending")))
      .returning({ id: schema.orders.id });
    if (claimed.length === 0) return;

    for (const item of items) {
      if (!item.variantId) continue;
      await tx
        .update(schema.variants)
        .set({ stock: sql`${schema.variants.stock} - ${item.quantity}` })
        .where(and(eq(schema.variants.id, item.variantId), gte(schema.variants.stock, item.quantity)));
    }

    if (order.couponCode) {
      await tx
        .update(schema.coupons)
        .set({ uses: sql`${schema.coupons.uses} + 1` })
        .where(eq(schema.coupons.code, order.couponCode));
    }
  });

  await sendOrderConfirmationEmail(order.email, {
    id: order.id,
    totalCents: order.totalCents,
    items: items.map((i) => ({ name: i.productName, size: i.size, color: i.color, quantity: i.quantity })),
  }).catch((err) => console.error("Order confirmation email failed", err));

  return { ok: true as const };
}

export async function getOrderItemsWithStock(variantIds: string[]) {
  if (variantIds.length === 0) return [];
  return db.select().from(schema.variants).where(inArray(schema.variants.id, variantIds));
}
