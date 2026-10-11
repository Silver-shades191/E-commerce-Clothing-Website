import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm, ResetRequestForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const sp = await searchParams;
  const hasToken = Boolean(sp.token && sp.email);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="fade-up w-full max-w-md">
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 text-4xl">{hasToken ? "Choose a new password" : "Reset password"}</h1>
        <div className="mt-10">
          {hasToken ? (
            <ResetPasswordForm email={sp.email!} token={sp.token!} />
          ) : (
            <ResetRequestForm />
          )}
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          <Link href="/login" className="text-gold underline-offset-4 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
