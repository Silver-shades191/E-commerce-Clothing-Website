import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl tracking-[0.22em]">ATELIER</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Considered shirts and tees, cut from long-staple cotton and finished by hand.
          </p>
        </div>
        <nav aria-label="Help" className="flex flex-col gap-3 text-sm">
          <p className="eyebrow mb-1">Help</p>
          <Link href="/shop" className="text-muted hover:text-bone">Shop</Link>
          <Link href="/orders" className="text-muted hover:text-bone">Orders</Link>
          <Link href="/refunds" className="text-muted hover:text-bone">Returns &amp; refunds</Link>
        </nav>
        <nav aria-label="Legal" className="flex flex-col gap-3 text-sm">
          <p className="eyebrow mb-1">Legal</p>
          <Link href="/privacy" className="text-muted hover:text-bone">Privacy policy</Link>
          <Link href="/terms" className="text-muted hover:text-bone">Terms of service</Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-6 text-xs text-muted">© {new Date().getFullYear()} Atelier. All rights reserved.</p>
      </div>
    </footer>
  );
}
