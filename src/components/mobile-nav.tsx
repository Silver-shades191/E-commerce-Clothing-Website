"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({
  categories,
  signedIn,
}: {
  categories: { slug: string; name: string }[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-raised"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
      </button>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-50 bg-ink p-6">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            <Link onClick={() => setOpen(false)} href="/shop" className="rounded-xl px-3 py-4 font-display text-2xl">Shop all</Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                onClick={() => setOpen(false)}
                href={`/category/${c.slug}`}
                className="rounded-xl px-3 py-4 font-display text-2xl text-muted"
              >
                {c.name}
              </Link>
            ))}
            <div className="my-4 h-px bg-line" />
            <Link onClick={() => setOpen(false)} href={signedIn ? "/account" : "/login"} className="px-3 py-3 text-muted">
              {signedIn ? "Account" : "Sign in"}
            </Link>
            <Link onClick={() => setOpen(false)} href="/orders" className="px-3 py-3 text-muted">Orders</Link>
          </nav>
        </div>
      )}
    </div>
  );
}
