import Link from "next/link";
import { auth } from "@/auth";
import { CartButton } from "@/components/cart-button";
import { MobileNav } from "@/components/mobile-nav";
import { getCategories } from "@/lib/catalog";

export async function Header() {
  const [session, categories] = await Promise.all([auth(), getCategories()]);
  const isStaff = session?.user.role === "admin" || session?.user.role === "support";

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-xl tracking-[0.22em]" aria-label="Atelier home">
          ATELIER
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm md:flex">
          <Link href="/shop" className="text-muted transition hover:text-bone">Shop</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="text-muted transition hover:text-bone">
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={session ? "/account" : "/login"}
            className="hidden rounded-full px-3 py-2 text-sm text-muted transition hover:text-bone sm:inline-flex"
          >
            {session ? "Account" : "Sign in"}
          </Link>
          {isStaff && (
            <Link href="/admin" className="hidden rounded-full px-3 py-2 text-sm text-gold transition hover:text-gold-strong sm:inline-flex">
              Admin
            </Link>
          )}
          <CartButton />
          <MobileNav categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} signedIn={Boolean(session)} />
        </div>
      </div>
    </header>
  );
}
