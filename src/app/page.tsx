import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategories, getFeaturedProducts } from "@/lib/catalog";
import { ProductImage } from "@/components/product-image";

// Stock and featured items change often, so render per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([getCategories(), getFeaturedProducts(4)]);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_20%,_rgb(201_169_110/0.14),_transparent_70%)]" />
        <div className="container-page grid min-h-[78vh] items-center gap-12 py-24 lg:grid-cols-12">
          <div className="fade-up lg:col-span-7">
            <p className="eyebrow">Autumn / Winter 2026</p>
            <h1 className="mt-6 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Cut for the <em className="text-gold not-italic">considered</em> wardrobe.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Long-staple cotton, precise tailoring and finishes you notice on the second wear. Shirts and tees built to last
              years, not seasons.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">Shop the collection</Link>
              <Link href="/category/t-shirts" className="btn btn-outline">Explore tees</Link>
            </div>
          </div>
          <div className="fade-up relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line lg:col-span-5" style={{ animationDelay: "120ms" }}>
            <ProductImage alt="Featured collection" priority />
          </div>
        </div>
      </section>

      <section aria-labelledby="categories" className="container-page py-24">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Shop by category</p>
            <h2 id="categories" className="mt-3 text-3xl sm:text-4xl">Find your fit</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="card group relative flex min-h-56 flex-col justify-end overflow-hidden p-7 transition duration-500 hover:-translate-y-1 hover:border-gold/60"
            >
              <span className="eyebrow">Collection</span>
              <h3 className="mt-2 text-2xl">{c.name}</h3>
              <p className="mt-2 text-sm text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="container-page pb-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Editor&rsquo;s picks</p>
              <h2 id="featured" className="mt-3 text-3xl sm:text-4xl">Featured this season</h2>
            </div>
            <Link href="/shop" className="text-sm text-muted underline-offset-4 hover:text-bone hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-line bg-surface">
        <div className="container-page grid gap-10 py-16 sm:grid-cols-3">
          {[
            ["Fabric", "Long-staple cotton and Italian poplin, sourced for weight and drape."],
            ["Fit", "Patterns drafted in three body blocks, with tested sizing charts on every product."],
            ["Returns", "Thirty days to return unworn items. Refunds go back to your original payment method."],
          ].map(([title, text]) => (
            <div key={title}>
              <h3 className="text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
