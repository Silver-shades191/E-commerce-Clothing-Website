import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const nav = [
  { href: "/admin", label: "Analytics", roles: ["admin", "support"] },
  { href: "/admin/inventory", label: "Inventory", roles: ["admin", "support"] },
  { href: "/admin/orders", label: "Orders", roles: ["admin", "support"] },
  { href: "/admin/users", label: "Users", roles: ["admin"] },
];

// Authorization is enforced here on the server, not just by hiding links.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  const role = session.user.role;
  if (role !== "admin" && role !== "support") redirect("/");

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[14rem_1fr]">
      <aside>
        <p className="eyebrow">Back office</p>
        <p className="mt-2 text-sm text-muted">Signed in as <span className="text-bone">{role}</span></p>
        <nav aria-label="Admin" className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {nav.filter((n) => n.roles.includes(role)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-raised hover:text-bone"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
