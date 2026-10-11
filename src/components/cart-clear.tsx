"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

// Empties the bag once an order is confirmed as paid.
export function CartClear() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
