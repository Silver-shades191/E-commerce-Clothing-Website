import type { Metadata } from "next";
import { desc, count, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { RoleSelect } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Users", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      verified: schema.users.emailVerified,
      createdAt: schema.users.createdAt,
      hasPassword: sql<boolean>`${schema.users.passwordHash} is not null`,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(200);

  const orderCounts = users.length
    ? await db
        .select({ userId: schema.orders.userId, n: count() })
        .from(schema.orders)
        .where(inArray(schema.orders.userId, users.map((u) => u.id)))
        .groupBy(schema.orders.userId)
    : [];
  const countsByUser = new Map(orderCounts.map((o) => [o.userId, Number(o.n)]));

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Customers</p>
        <h1 className="mt-2 text-4xl">Users</h1>
        <p className="mt-3 text-sm text-muted">Roles control access: customers shop, support manages orders and stock, admins manage everything.</p>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">User accounts</caption>
          <thead className="border-b border-line text-xs uppercase tracking-widest text-muted">
            <tr>
              <th scope="col" className="px-5 py-4 font-normal">Name</th>
              <th scope="col" className="px-5 py-4 font-normal">Sign-in</th>
              <th scope="col" className="px-5 py-4 font-normal">Orders</th>
              <th scope="col" className="px-5 py-4 font-normal">Joined</th>
              <th scope="col" className="px-5 py-4 font-normal">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-4">
                  <p>{u.name ?? "—"}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-5 py-4 text-xs text-muted">
                  {u.hasPassword ? "Password" : "Google"} · {u.verified ? "verified" : "unverified"}
                </td>
                <td className="px-5 py-4 text-muted">{countsByUser.get(u.id) ?? 0}</td>
                <td className="px-5 py-4 text-muted">{new Date(u.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                <td className="px-5 py-4"><RoleSelect userId={u.id} role={u.role} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

