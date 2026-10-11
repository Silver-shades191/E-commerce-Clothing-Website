import { createHash, randomBytes } from "crypto";

export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD";

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY }).format(cents / 100);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// One-time tokens: the raw value goes in the email, only its hash is stored.
export function newToken() {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export const SHIPPING_CENTS = 1200;
export const FREE_SHIPPING_THRESHOLD_CENTS = 15000;
