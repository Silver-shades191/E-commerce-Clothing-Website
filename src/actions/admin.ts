"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireRole } from "@/lib/guard";
import { slugify } from "@/lib/utils";

async function audit(actorId: string, action: string, target: string) {
  await db.insert(schema.auditLog).values({ id: crypto.randomUUID(), actorId, action, target });
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().min(1),
  description: z.string().trim().min(10).max(4000),
  material: z.string().trim().max(200).optional().default(""),
  fit: z.string().trim().max(100).optional().default(""),
  priceCents: z.number().int().min(100).max(10_000_000),
  compareAtCents: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string().url()).max(8).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

export async function saveProduct(input: unknown) {
  const session = await requireRole(["admin"]);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.id) {
    await db
      .update(schema.products)
      .set({
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        material: data.material,
        fit: data.fit,
        priceCents: data.priceCents,
        compareAtCents: data.compareAtCents ?? null,
        images: data.images,
        featured: data.featured,
        published: data.published,
      })
      .where(eq(schema.products.id, data.id));
    await audit(session.user.id, "product.update", data.id);
  } else {
    const id = crypto.randomUUID();
    await db.insert(schema.products).values({
      id,
      slug: `${slugify(data.name)}-${id.slice(0, 6)}`,
      name: data.name,
      categoryId: data.categoryId,
      description: data.description,
      material: data.material,
      fit: data.fit,
      priceCents: data.priceCents,
      compareAtCents: data.compareAtCents ?? null,
      images: data.images,
      featured: data.featured,
      published: data.published,
    });
    await audit(session.user.id, "product.create", id);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/inventory");
  return { ok: true as const };
}

export async function setVariantStock(variantId: string, stock: number) {
  const session = await requireRole(["admin", "support"]);
  if (!Number.isInteger(stock) || stock < 0 || stock > 100_000) {
    return { ok: false as const, error: "Stock must be a whole number from 0 to 100000." };
  }
  await db.update(schema.variants).set({ stock }).where(eq(schema.variants.id, variantId));
  await audit(session.user.id, "variant.stock", `${variantId}=${stock}`);
  revalidatePath("/admin/inventory");
  return { ok: true as const };
}

const orderStatuses = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;

export async function setOrderStatus(orderId: string, status: (typeof orderStatuses)[number]) {
  const session = await requireRole(["admin", "support"]);
  if (!orderStatuses.includes(status)) return { ok: false as const, error: "Unknown status." };
  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, orderId));
  await audit(session.user.id, "order.status", `${orderId}=${status}`);
  revalidatePath("/admin/orders");
  return { ok: true as const };
}

export async function setUserRole(userId: string, role: "customer" | "support" | "admin") {
  const session = await requireRole(["admin"]);
  if (userId === session.user.id && role !== "admin") {
    return { ok: false as const, error: "You can't remove your own admin access." };
  }
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, userId));
  await audit(session.user.id, "user.role", `${userId}=${role}`);
  revalidatePath("/admin/users");
  return { ok: true as const };
}

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, "Use 3 to 40 letters, numbers, dashes or underscores."),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1),
  minSubtotalCents: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).nullable().optional(),
});

export async function createCoupon(input: unknown) {
  const session = await requireRole(["admin"]);
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  if (parsed.data.type === "percent" && parsed.data.value > 100) {
    return { ok: false as const, error: "Percent discounts can't exceed 100." };
  }
  await db.insert(schema.coupons).values({
    id: crypto.randomUUID(),
    ...parsed.data,
    maxUses: parsed.data.maxUses ?? null,
  });
  await audit(session.user.id, "coupon.create", parsed.data.code);
  revalidatePath("/admin");
  return { ok: true as const };
}
