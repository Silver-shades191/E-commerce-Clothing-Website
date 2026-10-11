"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-bone transition hover:bg-raised"
      aria-label={`Bag, ${ready ? count : 0} items`}
    >
      <ShoppingBag size={20} strokeWidth={1.5} aria-hidden />
      {ready && count > 0 && (
        <span
          className="fade-up absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-medium text-ink"
          aria-hidden
        >
          {count}
        </span>
      )}
    </Link>
  );
}
