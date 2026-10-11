import type { Metadata } from "next";
import { desc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { OrderStatusSelect } from "@/components/admin-forms";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(100);
  const items = orders.length
    ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    : [];

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Fulfilment</p>
        <h1 className="mt-2 text-4xl">Orders</h1>
        <p className="mt-3 text-sm text-muted">Most recent 100 orders. Status changes are recorded in the audit log.</p>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Orders</caption>
          <thead className="border-b border-line text-xs uppercase tracking-widest text-muted">
            <tr>
              <th scope="col" className="px-5 py-4 font-normal">Order</th>
              <th scope="col" className="px-5 py-4 font-normal">Customer</th>
              <th scope="col" className="px-5 py-4 font-normal">Items</th>
              <th scope="col" className="px-5 py-4 font-normal">Total</th>
              <th scope="col" className="px-5 py-4 font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">No orders yet.</td></tr>
            )}
            {orders.map((o) => {
              const own = items.filter((i) => i.orderId === o.id);
              const addr = o.shippingAddress as Record<string, string>;
              return (
                <tr key={o.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-mono">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                    <p className="mt-1 text-xs text-muted">via {o.paymentProvider}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p>{addr.fullName}</p>
                    <p className="text-xs text-muted">{o.email}</p>
                    <p className="text-xs text-muted">{addr.city}, {addr.country}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {own.map((i) => (
                      <p key={i.id}>{i.productName} · {i.color}, {i.size} × {i.quantity}</p>
                    ))}
                  </td>
                  <td className="px-5 py-4">
                    <p>{formatMoney(o.totalCents)}</p>
                    {o.discountCents > 0 && <p className="text-xs text-gold">{o.couponCode} −{formatMoney(o.discountCents)}</p>}
                  </td>
                  <td className="px-5 py-4"><OrderStatusSelect orderId={o.id} status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
