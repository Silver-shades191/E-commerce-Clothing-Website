"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_CENTS, formatMoney } from "@/lib/utils";

export function CartView() {
  const { lines, ready, setQuantity, remove, subtotalCents } = useCart();

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading your bag">
        {[0, 1].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card mx-auto max-w-xl p-12 text-center">
        <h2 className="text-2xl">Your bag is empty.</h2>
        <p className="mt-3 text-muted">Pieces you add will wait for you here.</p>
        <Link href="/shop" className="btn btn-primary mt-8">Continue shopping</Link>
      </div>
    );
  }

  const shipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <ul className="divide-y divide-line lg:col-span-8" aria-label="Items in your bag">
        {lines.map((l) => (
          <li key={l.variantId} className="flex gap-5 py-6">
            <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
              {l.image ? (
                <Image src={l.image} alt="" fill sizes="96px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-gold/30" aria-hidden>A</span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-4">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/product/${l.slug}`} className="font-display text-lg hover:text-gold-strong">{l.name}</Link>
                  <p className="mt-1 text-sm text-muted">{l.color} · {l.size}</p>
                </div>
                <p className="text-sm">{formatMoney(l.priceCents * l.quantity)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center rounded-full border border-line" role="group" aria-label={`Quantity for ${l.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity(l.variantId, l.quantity - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:text-gold"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm" aria-live="polite">{l.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                    disabled={l.quantity >= 10}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:text-gold disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button type="button" onClick={() => remove(l.variantId)} className="inline-flex items-center gap-2 text-sm text-muted hover:text-danger">
                  <Trash2 size={14} aria-hidden /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside aria-labelledby="summary" className="card h-fit p-7 lg:col-span-4">
        <h2 id="summary" className="text-xl">Summary</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping)}</dd></div>
        </dl>
        <div className="mt-5 flex justify-between border-t border-line pt-5 text-base">
          <span>Estimated total</span>
          <span className="font-medium">{formatMoney(subtotalCents + shipping)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Discount codes and taxes are applied at checkout.</p>
        <Link href="/checkout" className="btn btn-primary mt-7 w-full">Checkout</Link>
      </aside>
    </div>
  );
}
