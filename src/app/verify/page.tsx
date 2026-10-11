import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmail } from "@/actions/auth";

export const metadata: Metadata = { title: "Verify email", robots: { index: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
  const sp = await searchParams;
  const result = sp.token && sp.email ? await verifyEmail(sp.email, sp.token) : { ok: false, message: "This link is incomplete." };

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="card max-w-md p-10 text-center">
        <h1 className="text-3xl">{result.ok ? "Email verified" : "Verification failed"}</h1>
        <p className="mt-4 text-muted">{result.message}</p>
        <Link href="/login" className="btn btn-primary mt-8">Continue to sign in</Link>
      </div>
    </div>
  );
}
