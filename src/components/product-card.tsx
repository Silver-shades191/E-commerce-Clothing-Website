import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { formatMoney } from "@/lib/utils";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  images: string[];
  material: string | null;
  summary: { stock: number; sizes: string[]; colors: string[] };
};

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const soldOut = product.summary.stock === 0;
  const onSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents;

  return (
    <article className="group">
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`${product.name}, ${formatMoney(product.priceCents)}${soldOut ? ", sold out" : ""}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          <ProductImage src={product.images[0]} alt={product.name} priority={priority} className="group-hover:scale-[1.03]" />
          {soldOut && (
            <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] uppercase tracking-widest text-muted backdrop-blur">
              Sold out
            </span>
          )}
          {!soldOut && onSale && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] uppercase tracking-widest text-ink">
              Sale
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-snug">{product.name}</h3>
            {product.material && <p className="mt-1 truncate text-xs text-muted">{product.material}</p>}
          </div>
          <div className="text-right text-sm">
            <p className="text-bone">{formatMoney(product.priceCents)}</p>
            {onSale && <p className="text-xs text-muted line-through">{formatMoney(product.compareAtCents!)}</p>}
          </div>
        </div>
      </Link>
    </article>
  );
}
