import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ShopFilters, parsePriceBand } from "@/components/shop-filters";
import { getCategories, searchProducts, type SortKey } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = {
    q: one(sp.q)?.slice(0, 80),
    category: one(sp.category),
    size: one(sp.size),
    price: one(sp.price),
    sort: (one(sp.sort) as SortKey | undefined) ?? "featured",
  };
  const page = Number(one(sp.page) ?? 1) || 1;

  const [result, categories] = await Promise.all([
    searchProducts({ ...filters, ...parsePriceBand(filters.price), page }),
    getCategories(),
  ]);

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== "sort") qs.set(k, v);
    if (filters.sort !== "featured") qs.set("sort", filters.sort);
    if (p > 1) qs.set("page", String(p));
    return `/shop?${qs.toString()}`;
  };

  return (
    <div className="container-page py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Shop</h1>
        <p className="mt-4 text-muted">{result.total} {result.total === 1 ? "piece" : "pieces"}</p>
      </header>

      <ShopFilters defaults={filters} categories={categories} basePath="/shop" />

      {result.items.length === 0 ? (
        <div className="card mt-12 p-12 text-center">
          <h2 className="text-2xl">Nothing matches those filters.</h2>
          <p className="mt-3 text-muted">Try a broader search or clear a filter.</p>
          <Link href="/shop" className="btn btn-outline mt-8">Clear all filters</Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4" aria-label="Products">
          {result.items.map((p, i) => (
            <li key={p.id}>
              <ProductCard product={p} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-4 text-sm">
          {result.page > 1 && <Link href={pageHref(result.page - 1)} className="btn btn-outline">Previous</Link>}
          <span className="text-muted">Page {result.page} of {result.pageCount}</span>
          {result.page < result.pageCount && <Link href={pageHref(result.page + 1)} className="btn btn-outline">Next</Link>}
        </nav>
      )}
    </div>
  );
}
