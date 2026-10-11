"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { ActionState } from "@/actions/auth";
import { safeCallback } from "@/lib/redirect";

const messages: Record<string, string> = {
  email_not_verified: "Please verify your email first. Check your inbox for the link.",
  account_locked: "Too many failed attempts. Try again in 15 minutes or reset your password.",
};

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = safeCallback(formData.get("callbackUrl"));

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error.cause as { err?: { code?: string } } | undefined)?.err?.code;
      // Same generic message for wrong email and wrong password (no account enumeration).
      return { ok: false, message: messages[code ?? ""] ?? "Incorrect email or password." };
    }
    throw error; // includes Next.js redirect on success
  }
  return { ok: false, message: "Something went wrong. Please try again." };
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = safeCallback(formData.get("callbackUrl"));
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
