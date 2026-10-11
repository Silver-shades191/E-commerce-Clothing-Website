import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ShopFilters, parsePriceBand } from "@/components/shop-filters";
import { getCategories, getCategoryBySlug, searchProducts, type SortKey } from "@/lib/catalog";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return category
    ? { title: category.name, description: category.description ?? undefined }
    : { title: "Category" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const filters = {
    q: one(sp.q)?.slice(0, 80),
    size: one(sp.size),
    price: one(sp.price),
    sort: (one(sp.sort) as SortKey | undefined) ?? "featured",
  };
  const page = Number(one(sp.page) ?? 1) || 1;

  const [result, categories] = await Promise.all([
    searchProducts({ ...filters, category: slug, ...parsePriceBand(filters.price), page }),
    getCategories(),
  ]);

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-20">
          <p className="eyebrow">Collection</p>
          <h1 className="mt-4 text-5xl sm:text-6xl">{category.name}</h1>
          {category.description && <p className="mt-5 max-w-xl text-lg text-muted">{category.description}</p>}
        </div>
      </section>

      <div className="container-page py-12">
        <ShopFilters defaults={{ ...filters, category: slug }} categories={categories} basePath={`/category/${slug}`} />

        {result.items.length === 0 ? (
          <p className="mt-16 text-center text-muted">No pieces in this collection match your filters yet.</p>
        ) : (
          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4" aria-label={`${category.name} products`}>
            {result.items.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
