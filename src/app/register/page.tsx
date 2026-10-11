import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="fade-up w-full max-w-md">
        <p className="eyebrow">Join Atelier</p>
        <h1 className="mt-3 text-4xl">Create account</h1>
        <p className="mt-4 text-sm text-muted">Save addresses, track orders and keep a wishlist.</p>
        <div className="mt-10">
          <RegisterForm />
        </div>
        <p className="mt-10 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-gold underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
