"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { toggleWishlist } from "@/actions/account";
import { formatMoney } from "@/lib/utils";

type Variant = { id: string; size: string; color: string; stock: number };

export function ProductPurchase({
  product,
  variants,
  isSignedIn,
  initiallySaved,
}: {
  product: { id: string; slug: string; name: string; priceCents: number; image: string | null };
  variants: Variant[];
  isSignedIn: boolean;
  initiallySaved: boolean;
}) {
  const { add } = useCart();
  const colors = [...new Set(variants.map((v) => v.color))];
  const sizes = [...new Set(variants.map((v) => v.size))];

  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  const selected = variants.find((v) => v.color === color && v.size === size);
  const inStockFor = (s: string) => variants.some((v) => v.color === color && v.size === s && v.stock > 0);
  const canAdd = Boolean(selected && selected.stock > 0);

  const addToBag = () => {
    if (!selected) return setStatus("Choose a size to continue.");
    add(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        color: selected.color,
        size: selected.size,
        priceCents: product.priceCents,
        image: product.image,
      },
      1,
    );
    setStatus(`Added to your bag: ${selected.color}, ${selected.size}.`);
  };

  const onWishlist = async () => {
    if (!isSignedIn) {
      window.location.href = `/login?callbackUrl=/product/${product.slug}`;
      return;
    }
    setPending(true);
    const res = await toggleWishlist(product.id);
    setSaved(res.saved);
    setPending(false);
  };

  return (
    <div className="flex flex-col gap-7">
      <fieldset>
        <legend className="field-label">Colour: <span className="text-bone normal-case tracking-normal">{color}</span></legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === color}
              onClick={() => {
                setColor(c);
                setSize(null);
              }}
              className="chip"
              data-active={c === color}
            >
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Size</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Size">
          {sizes.map((s) => {
            const available = inStockFor(s);
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={size === s}
                disabled={!available}
                onClick={() => setSize(s)}
                className="h-11 rounded-lg border border-line text-sm transition hover:border-gold disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 aria-checked:border-gold aria-checked:bg-gold/10 aria-checked:text-gold-strong"
              >
                {s}
              </button>
            );
          })}
        </div>
        {selected && selected.stock > 0 && selected.stock <= 5 && (
          <p className="mt-3 text-sm text-gold" role="status">Only {selected.stock} left in this size.</p>
        )}
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={addToBag} disabled={!canAdd && size !== null} className="btn btn-primary flex-1">
          {!size ? "Select a size" : canAdd ? "Add to bag" : "Out of stock"}
        </button>
        <button
          type="button"
          onClick={onWishlist}
          disabled={pending}
          aria-pressed={saved}
          className="btn btn-outline"
        >
          <Heart size={16} className={saved ? "fill-gold text-gold" : ""} aria-hidden />
          {saved ? "Saved to wishlist" : "Save to wishlist"}
        </button>
      </div>

      <p className="min-h-5 text-sm text-muted" role="status" aria-live="polite">
        {status}
      </p>
      <p className="text-xs text-muted">{formatMoney(product.priceCents)} · Free shipping on orders over $150.</p>
    </div>
  );
}
