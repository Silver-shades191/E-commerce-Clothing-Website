"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCoupon, saveProduct, setOrderStatus, setUserRole, setVariantStock } from "@/actions/admin";

export function StockInput({ variantId, initial }: { variantId: string; initial: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(initial));
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await setVariantStock(variantId, Number(value));
          setSaved(res.ok ? "Saved" : res.error);
          if (res.ok) router.refresh();
        });
      }}
    >
      <label htmlFor={`stock-${variantId}`} className="sr-only">Stock</label>
      <input
        id={`stock-${variantId}`}
        type="number"
        min={0}
        max={100000}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input w-24 py-2"
      />
      <button type="submit" disabled={pending} className="btn btn-outline min-h-9 px-4 py-1 text-xs">Update</button>
      {saved && <span role="status" className="text-xs text-muted">{saved}</span>}
    </form>
  );
}

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <>
      <label htmlFor={`status-${orderId}`} className="sr-only">Order status</label>
      <select
        id={`status-${orderId}`}
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setOrderStatus(orderId, e.target.value as "pending" | "paid" | "fulfilled" | "cancelled" | "refunded");
            router.refresh();
          })
        }
        className="input w-44 py-2"
      >
        {["pending", "paid", "fulfilled", "cancelled", "refunded"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`role-${userId}`} className="sr-only">Role</label>
      <select
        id={`role-${userId}`}
        defaultValue={role}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            const res = await setUserRole(userId, e.target.value as "customer" | "support" | "admin");
            if (!res.ok) setError(res.error);
            else router.refresh();
          })
        }
        className="input w-40 py-2"
      >
        <option value="customer">customer</option>
        <option value="support">support</option>
        <option value="admin">admin</option>
      </select>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function CouponForm() {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const res = await createCoupon({
            code: String(f.get("code") ?? ""),
            type: f.get("type") === "fixed" ? "fixed" : "percent",
            value: Math.round(Number(f.get("value"))) * (f.get("type") === "fixed" ? 100 : 1),
            minSubtotalCents: Math.round(Number(f.get("min") || 0) * 100),
            maxUses: f.get("maxUses") ? Number(f.get("maxUses")) : null,
          });
          setMessage(res.ok ? { ok: true, text: "Code created." } : { ok: false, text: res.error });
          if (res.ok) {
            e.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <div><label htmlFor="code" className="field-label">Code</label><input id="code" name="code" required className="input uppercase" placeholder="SPRING15" /></div>
      <div>
        <label htmlFor="type" className="field-label">Type</label>
        <select id="type" name="type" className="input"><option value="percent">Percent off</option><option value="fixed">Fixed amount</option></select>
      </div>
      <div><label htmlFor="value" className="field-label">Value (% or amount)</label><input id="value" name="value" type="number" min={1} required className="input" /></div>
      <div><label htmlFor="min" className="field-label">Minimum spend</label><input id="min" name="min" type="number" min={0} className="input" placeholder="0" /></div>
      <div><label htmlFor="maxUses" className="field-label">Max uses (optional)</label><input id="maxUses" name="maxUses" type="number" min={1} className="input" /></div>
      <div className="flex items-end"><button type="submit" disabled={pending} className="btn btn-primary w-full">Create code</button></div>
      {message && <p role="status" className={`sm:col-span-2 text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
    </form>
  );
}

export function ProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const res = await saveProduct({
            name: String(f.get("name") ?? ""),
            categoryId: String(f.get("categoryId") ?? ""),
            description: String(f.get("description") ?? ""),
            material: String(f.get("material") ?? ""),
            fit: String(f.get("fit") ?? ""),
            priceCents: Math.round(Number(f.get("price")) * 100),
            images: String(f.get("image") ?? "") ? [String(f.get("image"))] : [],
            featured: f.get("featured") === "on",
            published: true,
          });
          setMessage(res.ok ? { ok: true, text: "Product created. Add variants and stock from the list." } : { ok: false, text: res.error });
          if (res.ok) e.currentTarget.reset();
        });
      }}
    >
      <div className="sm:col-span-2"><label htmlFor="pname" className="field-label">Name</label><input id="pname" name="name" required minLength={2} className="input" /></div>
      <div>
        <label htmlFor="pcat" className="field-label">Category</label>
        <select id="pcat" name="categoryId" required className="input">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label htmlFor="pprice" className="field-label">Price (USD)</label><input id="pprice" name="price" type="number" min={1} step="0.01" required className="input" /></div>
      <div className="sm:col-span-2"><label htmlFor="pdesc" className="field-label">Description</label><textarea id="pdesc" name="description" rows={3} required minLength={10} className="input" /></div>
      <div><label htmlFor="pmat" className="field-label">Material</label><input id="pmat" name="material" className="input" placeholder="100% long-staple cotton" /></div>
      <div><label htmlFor="pfit" className="field-label">Fit</label><input id="pfit" name="fit" className="input" placeholder="Slim" /></div>
      <div className="sm:col-span-2"><label htmlFor="pimg" className="field-label">Image URL (optional)</label><input id="pimg" name="image" type="url" className="input" /></div>
      <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
        <input type="checkbox" name="featured" className="h-4 w-4 accent-[var(--color-gold)]" /> Feature on homepage
      </label>
      <div className="sm:col-span-2 flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">Create product</button>
        {message && <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
