"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/guard";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100).optional().default(""),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().length(2),
  phone: z.string().trim().max(30).optional().default(""),
});

export async function saveAddress(input: unknown) {
  const session = await requireUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  await db.insert(schema.addresses).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    ...parsed.data,
    isDefault: false,
  });
  revalidatePath("/account");
  return { ok: true as const };
}

export async function deleteAddress(id: string) {
  const session = await requireUser();
  await db
    .delete(schema.addresses)
    .where(and(eq(schema.addresses.id, id), eq(schema.addresses.userId, session.user.id)));
  revalidatePath("/account");
  return { ok: true as const };
}

export async function updateName(name: string) {
  const session = await requireUser();
  const clean = name.trim();
  if (clean.length < 2 || clean.length > 80) return { ok: false as const, error: "Enter a name between 2 and 80 characters." };
  await db.update(schema.users).set({ name: clean }).where(eq(schema.users.id, session.user.id));
  revalidatePath("/account");
  return { ok: true as const };
}

export async function toggleWishlist(productId: string) {
  const session = await requireUser();
  const key = { userId: session.user.id, productId };
  const existing = await db.query.wishlist.findFirst({
    where: and(eq(schema.wishlist.userId, key.userId), eq(schema.wishlist.productId, productId)),
  });
  if (existing) {
    await db.delete(schema.wishlist).where(and(eq(schema.wishlist.userId, key.userId), eq(schema.wishlist.productId, productId)));
  } else {
    await db.insert(schema.wishlist).values(key);
  }
  revalidatePath("/account");
  return { ok: true as const, saved: !existing };
}

export async function submitReview(input: { productId: string; rating: number; title: string; body: string }) {
  const session = await requireUser();
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) return { ok: false as const, error: "Choose a rating from 1 to 5." };
  const body = input.body.trim();
  if (body.length < 10 || body.length > 2000) return { ok: false as const, error: "Reviews should be 10 to 2000 characters." };

  // Only customers who have a paid order containing this product may review it.
  const purchased = await db
    .select({ id: schema.orderItems.id })
    .from(schema.orderItems)
    .innerJoin(schema.variants, eq(schema.variants.id, schema.orderItems.variantId))
    .innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId))
    .where(
      and(
        eq(schema.orders.userId, session.user.id),
        eq(schema.variants.productId, input.productId),
      ),
    )
    .limit(1);
  if (purchased.length === 0) return { ok: false as const, error: "Only verified buyers can leave a review." };

  await db.insert(schema.reviews).values({
    id: crypto.randomUUID(),
    productId: input.productId,
    userId: session.user.id,
    rating,
    title: input.title.trim().slice(0, 120) || null,
    body,
  });
  revalidatePath(`/product`);
  return { ok: true as const };
}
