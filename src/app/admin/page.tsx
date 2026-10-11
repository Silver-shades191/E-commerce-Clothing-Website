import type { Metadata } from "next";
import { count, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CouponForm } from "@/components/admin-forms";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

const REVENUE_STATUSES = ["paid", "fulfilled"] as const;

export default async function AdminDashboard() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60_000);
  const paidWhere = inArray(schema.orders.status, [...REVENUE_STATUSES]);

  const [totals] = await db
    .select({ revenue: sql<number>`coalesce(sum(${schema.orders.totalCents}), 0)`, orders: count() })
    .from(schema.orders)
    .where(paidWhere);

  const [{ customers }] = await db.select({ customers: count() }).from(schema.users);
  const [{ pending }] = await db
    .select({ pending: count() })
    .from(schema.orders)
    .where(eq(schema.orders.status, "pending"));

  const daily = await db
    .select({
      day: sql<string>`date(${schema.orders.createdAt} / 1000, 'unixepoch')`,
      revenue: sql<number>`coalesce(sum(${schema.orders.totalCents}), 0)`,
      orders: count(),
    })
    .from(schema.orders)
    .where(sql`${paidWhere} and ${schema.orders.createdAt} >= ${since.getTime()}`)
    .groupBy(sql`date(${schema.orders.createdAt} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${schema.orders.createdAt} / 1000, 'unixepoch')`);

  const topProducts = await db
    .select({
      name: schema.orderItems.productName,
      units: sql<number>`sum(${schema.orderItems.quantity})`,
      revenue: sql<number>`sum(${schema.orderItems.unitPriceCents} * ${schema.orderItems.quantity})`,
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(paidWhere)
    .groupBy(schema.orderItems.productName)
    .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
    .limit(5);

  const lowStock = await db
    .select({ sku: schema.variants.sku, size: schema.variants.size, color: schema.variants.color, stock: schema.variants.stock, name: schema.products.name })
    .from(schema.variants)
    .innerJoin(schema.products, eq(schema.products.id, schema.variants.productId))
    .where(sql`${schema.variants.stock} <= ${schema.variants.lowStockAt}`)
    .orderBy(schema.variants.stock)
    .limit(8);

  const coupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.uses)).limit(10);

  const aov = totals.orders > 0 ? Math.round(totals.revenue / totals.orders) : 0;
  const maxDaily = Math.max(1, ...daily.map((d) => d.revenue));

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow">Overview</p>
        <h1 className="mt-2 text-4xl">Analytics</h1>
      </header>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Revenue", value: formatMoney(totals.revenue) },
          { label: "Paid orders", value: String(totals.orders) },
          { label: "Average order", value: formatMoney(aov) },
          { label: "Customers", value: String(customers) },
        ].map((k) => (
          <div key={k.label} className="card p-6">
            <p className="text-xs uppercase tracking-widest text-muted">{k.label}</p>
            <p className="mt-3 font-display text-3xl">{k.value}</p>
          </div>
        ))}
      </section>

      {pending > 0 && (
        <p className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold-strong">
          {pending} order{pending === 1 ? " is" : "s are"} awaiting payment confirmation.
        </p>
      )}

      <section aria-labelledby="trend-h" className="card p-7">
        <h2 id="trend-h" className="text-2xl">Revenue, last 14 days</h2>
        {daily.length === 0 ? (
          <p className="mt-6 text-sm text-muted">No paid orders in this period yet.</p>
        ) : (
          <div className="mt-8 flex h-56 items-end gap-2" role="img" aria-label="Daily revenue bar chart">
            {daily.map((d) => (
              <div key={d.day} className="group flex h-full flex-1 flex-col justify-end gap-2">
                <div
                  className="rounded-t-md bg-gradient-to-t from-gold/40 to-gold transition duration-500 group-hover:to-gold-strong"
                  style={{ height: `${Math.max(4, (d.revenue / maxDaily) * 100)}%` }}
                  title={`${d.day}: ${formatMoney(d.revenue)} from ${d.orders} orders`}
                />
                <span className="text-center text-[10px] text-muted">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="top-h" className="card p-7">
          <h2 id="top-h" className="text-2xl">Best sellers</h2>
          <ul className="mt-6 divide-y divide-line text-sm">
            {topProducts.length === 0 && <li className="py-3 text-muted">No sales yet.</li>}
            {topProducts.map((p) => (
              <li key={p.name} className="flex justify-between py-3">
                <span>{p.name}</span>
                <span className="text-muted">{p.units} sold · {formatMoney(Number(p.revenue))}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="low-h" className="card p-7">
          <h2 id="low-h" className="text-2xl">Low stock</h2>
          <ul className="mt-6 divide-y divide-line text-sm">
            {lowStock.length === 0 && <li className="py-3 text-muted">Every variant is comfortably stocked.</li>}
            {lowStock.map((v) => (
              <li key={v.sku} className="flex justify-between py-3">
                <span>{v.name} <span className="text-muted">· {v.color}, {v.size}</span></span>
                <span className={v.stock === 0 ? "text-danger" : "text-gold"}>{v.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="coupon-h" className="grid gap-8 xl:grid-cols-2">
        <div className="card p-7">
          <h2 id="coupon-h" className="text-2xl">Discount codes</h2>
          <ul className="mt-6 divide-y divide-line text-sm">
            {coupons.length === 0 && <li className="py-3 text-muted">No codes yet.</li>}
            {coupons.map((c) => (
              <li key={c.id} className="flex justify-between py-3">
                <span className="font-mono">{c.code}</span>
                <span className="text-muted">
                  {c.type === "percent" ? `${c.value}%` : formatMoney(c.value)} off · {c.uses}
                  {c.maxUses ? `/${c.maxUses}` : ""} used {c.active ? "" : "· inactive"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-7">
          <h2 className="text-2xl">New discount code</h2>
          <div className="mt-6"><CouponForm /></div>
        </div>
      </section>
    </div>
  );
}

