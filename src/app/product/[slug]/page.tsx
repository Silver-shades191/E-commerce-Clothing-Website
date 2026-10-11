import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { ProductImage } from "@/components/product-image";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductCard } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { formatMoney } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: { images: product.images[0] ? [product.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const [related, saved, canReview] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId, 3),
    session?.user?.id
      ? db.query.wishlist.findFirst({
          where: and(eq(schema.wishlist.userId, session.user.id), eq(schema.wishlist.productId, product.id)),
        })
      : null,
    session?.user?.id
      ? db
          .select({ id: schema.orderItems.id })
          .from(schema.orderItems)
          .innerJoin(schema.variants, eq(schema.variants.id, schema.orderItems.variantId))
          .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
          .where(and(eq(schema.orders.userId, session.user.id), eq(schema.variants.productId, product.id)))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
  ]);

  const soldOut = product.variants.every((v) => v.stock === 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: process.env.NEXT_PUBLIC_CURRENCY ?? "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(product.rating.count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average.toFixed(1), reviewCount: product.rating.count },
    }),
  };

  return (
    <div className="container-page py-12 lg:py-16">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="hover:text-bone">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={`/category/${product.category?.slug}`} className="hover:text-bone">{product.category?.name}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-bone">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:col-span-7">
          <ProductImage src={product.images[0]} alt={product.name} priority sizes="(min-width: 1024px) 58vw, 100vw" />
        </div>

        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <p className="eyebrow">{product.category?.name}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-2xl">
            {formatMoney(product.priceCents)}
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <span className="ml-3 text-base text-muted line-through">{formatMoney(product.compareAtCents)}</span>
            )}
          </p>
          {product.rating.count > 0 && (
            <p className="mt-3 text-sm text-muted" aria-label={`Rated ${product.rating.average.toFixed(1)} out of 5`}>
              ★ {product.rating.average.toFixed(1)} · {product.rating.count} {product.rating.count === 1 ? "review" : "reviews"}
            </p>
          )}

          <div className="mt-8 border-t border-line pt-8">
            {soldOut ? (
              <p className="mb-6 text-muted">This piece is currently sold out. Save it to your wishlist to hear when it returns.</p>
            ) : null}
            <ProductPurchase
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceCents: product.priceCents,
                image: product.images[0] ?? null,
              }}
              variants={product.variants.map((v) => ({ id: v.id, size: v.size, color: v.color, stock: v.stock }))}
              isSignedIn={Boolean(session?.user)}
              initiallySaved={Boolean(saved)}
            />
          </div>

          <dl className="mt-10 grid gap-5 border-t border-line pt-8 text-sm">
            <div>
              <dt className="field-label">Description</dt>
              <dd className="leading-relaxed text-muted">{product.description}</dd>
            </div>
            {product.material && (
              <div>
                <dt className="field-label">Material</dt>
                <dd className="text-muted">{product.material}</dd>
              </div>
            )}
            {product.fit && (
              <div>
                <dt className="field-label">Fit</dt>
                <dd className="text-muted">{product.fit}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <section aria-labelledby="reviews-heading" className="mt-24 grid gap-12 border-t border-line pt-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="reviews-heading" className="text-3xl">Reviews</h2>
          <p className="mt-3 text-sm text-muted">Reviews are limited to verified buyers of this item.</p>
          {session?.user && canReview && <ReviewForm productId={product.id} />}
        </div>
        <ul className="space-y-8 lg:col-span-8">
          {product.reviews.length === 0 && <li className="text-muted">No reviews yet.</li>}
          {product.reviews.map((r) => (
            <li key={r.id} className="card p-6">
              <p className="text-gold" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
              {r.title && <h3 className="mt-3 text-lg">{r.title}</h3>}
              <p className="mt-2 leading-relaxed text-muted">{r.body}</p>
              <p className="mt-4 text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24 border-t border-line pt-16">
          <h2 id="related-heading" className="text-3xl">You may also like</h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.id}><ProductCard product={p} /></li>
            ))}
          </ul>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
