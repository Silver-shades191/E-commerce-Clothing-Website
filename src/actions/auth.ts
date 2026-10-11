"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { hashToken, newToken } from "@/lib/utils";

export type ActionState = { ok: boolean; message?: string; errors?: Record<string, string> };

const passwordRule = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: passwordRule,
});

async function clientKey(prefix: string, email: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${prefix}:${ip}:${email}`;
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const errors = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0] as string, i.message]));
    return { ok: false, errors };
  }

  const { name, email, password } = parsed.data;
  const limit = checkRateLimit(await clientKey("register", email), 5, 60 * 60_000);
  if (!limit.ok) return { ok: false, message: "Too many attempts. Please try again later." };

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  // Respond the same way whether or not the account exists (avoids account enumeration).
  if (existing) {
    return { ok: true, message: "Check your inbox to verify your email." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(schema.users).values({ id: crypto.randomUUID(), name, email, passwordHash, role: "customer" });

  const token = newToken();
  await db.insert(schema.verificationTokens).values({
    identifier: email,
    tokenHash: token.hash,
    kind: "verify",
    expires: new Date(Date.now() + 24 * 60 * 60_000),
  });
  await sendVerificationEmail(email, token.raw);

  return { ok: true, message: "Check your inbox to verify your email." };
}

export async function verifyEmail(email: string, rawToken: string): Promise<ActionState> {
  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.identifier, email.toLowerCase()),
      eq(schema.verificationTokens.tokenHash, hashToken(rawToken)),
      eq(schema.verificationTokens.kind, "verify"),
      gt(schema.verificationTokens.expires, new Date()),
    ),
  });
  if (!row) return { ok: false, message: "This link is invalid or has expired." };

  await db.update(schema.users).set({ emailVerified: new Date() }).where(eq(schema.users.email, email.toLowerCase()));
  await db.delete(schema.verificationTokens).where(eq(schema.verificationTokens.tokenHash, row.tokenHash));
  return { ok: true, message: "Your email is verified. You can sign in now." };
}

export async function resendVerification(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const limit = checkRateLimit(await clientKey("resend", email), 3, 60 * 60_000);
  if (!limit.ok) return { ok: false, message: "Too many requests. Please wait before trying again." };

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (user && !user.emailVerified) {
    const token = newToken();
    await db.insert(schema.verificationTokens).values({
      identifier: email,
      tokenHash: token.hash,
      kind: "verify",
      expires: new Date(Date.now() + 24 * 60 * 60_000),
    });
    await sendVerificationEmail(email, token.raw);
  }
  return { ok: true, message: "If that account needs verification, we've sent a new link." };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const limit = checkRateLimit(await clientKey("reset", email), 3, 60 * 60_000);
  if (!limit.ok) return { ok: false, message: "Too many requests. Please wait before trying again." };

  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (user?.passwordHash) {
    const token = newToken();
    await db.insert(schema.verificationTokens).values({
      identifier: email,
      tokenHash: token.hash,
      kind: "reset",
      expires: new Date(Date.now() + 60 * 60_000),
    });
    await sendPasswordResetEmail(email, token.raw);
  }
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawToken = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");

  const check = passwordRule.safeParse(password);
  if (!check.success) return { ok: false, message: check.error.issues[0].message };

  const row = await db.query.verificationTokens.findFirst({
    where: and(
      eq(schema.verificationTokens.identifier, email),
      eq(schema.verificationTokens.tokenHash, hashToken(rawToken)),
      eq(schema.verificationTokens.kind, "reset"),
      gt(schema.verificationTokens.expires, new Date()),
    ),
  });
  if (!row) return { ok: false, message: "This reset link is invalid or has expired." };

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .update(schema.users)
    .set({ passwordHash, failedLogins: 0, lockedUntil: null })
    .where(eq(schema.users.email, email));
  await db.delete(schema.verificationTokens).where(eq(schema.verificationTokens.identifier, email));
  return { ok: true, message: "Password updated. You can sign in now." };
}
