import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

const statusLabel: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  fulfilled: "Shipped",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/orders");

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.userId, session.user.id))
    .orderBy(desc(schema.orders.createdAt));

  const items = orders.length
    ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, orders.map((o) => o.id)))
    : [];

  return (
    <div className="container-page py-16">
      <h1 className="mb-12 text-4xl sm:text-5xl">Orders</h1>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted">You haven&rsquo;t placed an order yet.</p>
          <Link href="/shop" className="btn btn-primary mt-8">Start shopping</Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map((o) => {
            const own = items.filter((i) => i.orderId === o.id);
            return (
              <li key={o.id} className="card p-6 md:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-5">
                  <div>
                    <p className="font-display text-xl">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gold">{statusLabel[o.status]}</p>
                    <p className="mt-1">{formatMoney(o.totalCents)}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-muted">
                  {own.map((i) => (
                    <li key={i.id}>{i.productName} · {i.color}, {i.size} × {i.quantity}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
