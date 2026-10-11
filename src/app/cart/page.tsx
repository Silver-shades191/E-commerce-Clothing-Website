import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Bag", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-16">
      <h1 className="mb-12 text-4xl sm:text-5xl">Your bag</h1>
      <CartView />
    </div>
  );
}
