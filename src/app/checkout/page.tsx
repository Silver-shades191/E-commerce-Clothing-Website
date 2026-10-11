import type { Metadata } from "next";
import { auth } from "@/auth";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ cancelled?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  return (
    <div className="container-page py-16">
      <h1 className="mb-12 text-4xl sm:text-5xl">Checkout</h1>
      <CheckoutForm signedInEmail={session?.user?.email ?? null} cancelled={sp.cancelled === "1"} />
    </div>
  );
}
