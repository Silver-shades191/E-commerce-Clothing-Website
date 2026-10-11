"use server";

import { and, eq, gt, inArray, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import { stripe } from "@/lib/stripe";
import { fulfillOrder } from "@/lib/orders";
import { checkRateLimit } from "@/lib/rate-limit";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_CENTS, CURRENCY } from "@/lib/utils";

const itemsSchema = z
  .array(z.object({ variantId: z.string().min(1).max(64), quantity: z.number().int().min(1).max(10) }))
  .min(1)
  .max(50);

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

const checkoutSchema = z.object({
  items: itemsSchema,
  address: addressSchema,
  guestEmail: z.string().trim().toLowerCase().email().optional(),
  couponCode: z.string().trim().max(40).optional(),
});

export type CheckoutResult = { ok: true; redirectTo: string } | { ok: false; error: string };

type PricedLine = {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  unitPriceCents: number;
  quantity: number;
};

export async function placeOrder(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details and try again." };

  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? parsed.data.guestEmail;
  if (!email) return { ok: false, error: "Please sign in or enter an email for the receipt." };

  const limit = checkRateLimit(`checkout:${email}`, 10, 10 * 60_000);
  if (!limit.ok) return { ok: false, error: "Too many attempts. Please wait a few minutes." };

  // Re-price every line from the database. Client-supplied prices are ignored.
  const variantRows = await db
    .select({ variant: schema.variants, product: schema.products })
    .from(schema.variants)
    .innerJoin(schema.products, eq(schema.products.id, schema.variants.productId))
    .where(inArray(schema.variants.id, parsed.data.items.map((i) => i.variantId)));

  const lines: PricedLine[] = [];
  for (const req of parsed.data.items) {
    const row = variantRows.find((r) => r.variant.id === req.variantId);
    if (!row || !row.product.published) return { ok: false, error: "An item in your bag is no longer available." };
    if (row.variant.stock < req.quantity) {
      return {
        ok: false,
        error: `Only ${row.variant.stock} left of ${row.product.name} (${row.variant.color}, ${row.variant.size}).`,
      };
    }
    lines.push({
      variantId: row.variant.id,
      productName: row.product.name,
      size: row.variant.size,
      color: row.variant.color,
      unitPriceCents: row.product.priceCents,
      quantity: req.quantity,
    });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

  // Coupon validation happens here too, against the database.
  let discountCents = 0;
  let appliedCoupon: string | null = null;
  if (parsed.data.couponCode) {
    const code = parsed.data.couponCode.toUpperCase();
    const now = new Date();
    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(schema.coupons.code, code),
        eq(schema.coupons.active, true),
        or(isNull(schema.coupons.expiresAt), gt(schema.coupons.expiresAt, now)),
      ),
    });
    if (!coupon) return { ok: false, error: "That discount code is not valid." };
    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
      return { ok: false, error: "That discount code has been fully redeemed." };
    }
    if (subtotalCents < coupon.minSubtotalCents) {
      return { ok: false, error: "Your bag doesn't meet the minimum for that code." };
    }
    discountCents =
      coupon.type === "percent" ? Math.floor((subtotalCents * coupon.value) / 100) : Math.min(coupon.value, subtotalCents);
    appliedCoupon = code;
  }

  const afterDiscount = subtotalCents - discountCents;
  const shippingCents = afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
  const totalCents = afterDiscount + shippingCents;

  const orderId = crypto.randomUUID();
  const paymentProvider = stripe ? "stripe" : "demo";

  // Demo payments are for local development only. They are refused in production.
  if (!stripe && process.env.NODE_ENV === "production") {
    return { ok: false, error: "Payments are not configured yet." };
  }

  await db.insert(schema.orders).values({
    id: orderId,
    userId: session?.user?.id ?? null,
    email,
    status: "pending",
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    couponCode: appliedCoupon,
    shippingAddress: parsed.data.address as Record<string, string>,
    paymentProvider,
  });

  await db.insert(schema.orderItems).values(
    lines.map((l) => ({ id: crypto.randomUUID(), orderId, ...l })),
  );

  if (stripe) {
    const discountRatio = subtotalCents > 0 ? discountCents / subtotalCents : 0;
    const currency = CURRENCY.toLowerCase();
    const lineItems = lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency,
        unit_amount: Math.max(0, Math.round(l.unitPriceCents * (1 - discountRatio))),
        product_data: { name: `${l.productName} · ${l.color} / ${l.size}` },
      },
    }));
    if (shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: { currency, unit_amount: shippingCents, product_data: { name: "Shipping" } },
      });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      client_reference_id: orderId,
      metadata: { orderId },
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/confirmation?order=${orderId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=1`,
    });

    await db.update(schema.orders).set({ paymentRef: checkout.id }).where(eq(schema.orders.id, orderId));
    if (!checkout.url) return { ok: false, error: "Could not start payment. Please try again." };
    return { ok: true, redirectTo: checkout.url };
  }

  // Demo flow: confirm immediately so the full order path can be tested locally.
  await fulfillOrder(orderId, `demo_${orderId}`);
  return { ok: true, redirectTo: `/orders/confirmation?order=${orderId}` };
}

export async function listOrderIdsForUser(userId: string) {
  return db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.userId, userId));
}
