import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/utils";
import { CartClear } from "@/components/cart-clear";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  const order = orderId
    ? await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) })
    : null;

  // Only show orders that were actually paid. A pending or cancelled order is shown as such.
  const items = order ? await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)) : [];

  if (!order) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-4xl">We couldn&rsquo;t find that order.</h1>
        <Link href="/shop" className="btn btn-outline mt-10">Back to shop</Link>
      </div>
    );
  }

  const paid = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="container-page max-w-2xl py-20">
      {paid && <CartClear />}
      <p className="eyebrow">{paid ? "Thank you" : "Payment pending"}</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">
        {paid ? "Your order is confirmed." : "We're confirming your payment."}
      </h1>
      <p className="mt-5 text-muted">
        Order <span className="text-bone">#{order.id.slice(0, 8).toUpperCase()}</span>. A receipt is on its way to {order.email}.
        {!paid && " This page updates once Stripe confirms the payment, so refresh in a moment."}
      </p>

      <ul className="card mt-10 divide-y divide-line">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 p-5 text-sm">
            <span>{i.productName} <span className="text-muted">· {i.color}, {i.size} × {i.quantity}</span></span>
            <span>{formatMoney(i.unitPriceCents * i.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between p-5 font-medium">
          <span>Total</span>
          <span>{formatMoney(order.totalCents)}</span>
        </li>
      </ul>

      <div className="mt-10 flex gap-3">
        <Link href="/orders" className="btn btn-primary">View orders</Link>
        <Link href="/shop" className="btn btn-outline">Keep shopping</Link>
      </div>
    </div>
  );
}
