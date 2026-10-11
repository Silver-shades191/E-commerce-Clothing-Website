import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import { AddressForm, DeleteAddressButton, NameForm, SignOutButton } from "@/components/account-forms";
import { ProductCard } from "@/components/product-card";
import { getStockSummary } from "@/lib/catalog";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account");
  const userId = session.user.id;

  const [user, userAddresses, wishRows] = await Promise.all([
    db.query.users.findFirst({ where: eq(schema.users.id, userId) }),
    db.select().from(schema.addresses).where(eq(schema.addresses.userId, userId)).orderBy(desc(schema.addresses.isDefault)),
    db
      .select({ product: schema.products })
      .from(schema.wishlist)
      .innerJoin(schema.products, eq(schema.products.id, schema.wishlist.productId))
      .where(eq(schema.wishlist.userId, userId)),
  ]);

  if (!user) redirect("/login");
  const stock = await getStockSummary(wishRows.map((w) => w.product.id));
  const wishlist = wishRows.map((w) => ({
    ...w.product,
    summary: stock.get(w.product.id) ?? { stock: 0, sizes: [], colors: [] },
  }));

  return (
    <div className="container-page grid gap-16 py-16 lg:grid-cols-12">
      <aside className="space-y-2 lg:col-span-3">
        <p className="eyebrow">Account</p>
        <h1 className="mt-2 text-3xl">{user.name ?? "Your account"}</h1>
        <p className="text-sm text-muted">{user.email}</p>
        <nav aria-label="Account" className="mt-8 flex flex-col gap-1 text-sm">
          <Link href="/account" className="rounded-lg bg-raised px-3 py-2 text-bone">Profile</Link>
          <Link href="/orders" className="rounded-lg px-3 py-2 text-muted hover:bg-raised hover:text-bone">Orders</Link>
          {(user.role === "admin" || user.role === "support") && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-gold hover:bg-raised">Admin</Link>
          )}
        </nav>
        <div className="mt-8"><SignOutButton /></div>
      </aside>

      <div className="space-y-16 lg:col-span-9">
        <section aria-labelledby="profile-h" className="card p-7">
          <h2 id="profile-h" className="text-2xl">Profile</h2>
          <div className="mt-6"><NameForm initialName={user.name ?? ""} /></div>
          <p className="mt-4 text-xs text-muted">
            {user.emailVerified ? "Email verified." : "Email not verified."} Role: {user.role}.
          </p>
        </section>

        <section aria-labelledby="addr-h">
          <h2 id="addr-h" className="text-2xl">Addresses</h2>
          {userAddresses.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No saved addresses yet.</p>
          ) : (
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {userAddresses.map((a) => (
                <li key={a.id} className="card flex flex-col gap-3 p-6 text-sm">
                  <p className="font-medium">{a.fullName}</p>
                  <p className="text-muted">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
                    {a.city}{a.region ? `, ${a.region}` : ""} {a.postalCode}<br />
                    {a.country}
                  </p>
                  <div className="mt-auto pt-2"><DeleteAddressButton id={a.id} /></div>
                </li>
              ))}
            </ul>
          )}
          <details className="card mt-6 p-6">
            <summary className="cursor-pointer text-gold">Add a new address</summary>
            <div className="mt-6"><AddressForm /></div>
          </details>
        </section>

        <section aria-labelledby="wish-h">
          <h2 id="wish-h" className="text-2xl">Wishlist</h2>
          {wishlist.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Save pieces you love and they&rsquo;ll appear here.</p>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-3">
              {wishlist.map((p) => (
                <li key={p.id}><ProductCard product={p} /></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
