import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { safeCallback } from "@/lib/redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const sp = await searchParams;
  const callbackUrl = safeCallback(sp.callbackUrl, "/account");
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="fade-up w-full max-w-md">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-3 text-4xl">Sign in</h1>
        <div className="mt-10">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          New to Atelier?{" "}
          <Link href="/register" className="text-gold underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
