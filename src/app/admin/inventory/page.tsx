import type { Metadata } from "next";
import { asc, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { ProductForm, StockInput } from "@/components/admin-forms";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventory", robots: { index: false } };

export default async function InventoryPage() {
  const [products, categories] = await Promise.all([
    db.select().from(schema.products).orderBy(asc(schema.products.name)),
    db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder)),
  ]);
  const variants = products.length
    ? await db
        .select()
        .from(schema.variants)
        .where(inArray(schema.variants.productId, products.map((p) => p.id)))
        .orderBy(asc(schema.variants.size))
    : [];

  return (
    <div className="space-y-12">
      <header>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-2 text-4xl">Inventory</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Set stock per size and colour. Changes take effect immediately on the storefront.
        </p>
      </header>

      <section aria-labelledby="products-h" className="space-y-6">
        <h2 id="products-h" className="text-2xl">Products</h2>
        {products.map((p) => {
          const own = variants.filter((v) => v.productId === p.id);
          return (
            <article key={p.id} className="card p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                <h3 className="text-xl">{p.name}</h3>
                <p className="text-sm text-muted">
                  {formatMoney(p.priceCents)} · {p.published ? "Published" : "Hidden"} · {own.reduce((n, v) => n + v.stock, 0)} units
                </p>
              </div>
              {own.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No variants yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-widest text-muted">
                      <tr>
                        <th scope="col" className="py-2 font-normal">SKU</th>
                        <th scope="col" className="py-2 font-normal">Colour</th>
                        <th scope="col" className="py-2 font-normal">Size</th>
                        <th scope="col" className="py-2 font-normal">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {own.map((v) => (
                        <tr key={v.id}>
                          <td className="py-3 font-mono text-xs text-muted">{v.sku}</td>
                          <td className="py-3">{v.color}</td>
                          <td className="py-3">{v.size}</td>
                          <td className="py-3">
                            <StockInput variantId={v.id} initial={v.stock} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </section>

      <section aria-labelledby="new-h" className="card p-7">
        <h2 id="new-h" className="text-2xl">Add a product</h2>
        <p className="mt-2 text-sm text-muted">Variants and stock are added after the product is created.</p>
        <div className="mt-6">
          <ProductForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
