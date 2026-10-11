"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "@/components/cart-provider";
import { placeOrder } from "@/actions/checkout";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_CENTS, formatMoney } from "@/lib/utils";

export function CheckoutForm({ signedInEmail, cancelled }: { signedInEmail: string | null; cancelled: boolean }) {
  const { lines, ready, subtotalCents, clear } = useCart();
  const [error, setError] = useState<string | null>(cancelled ? "Payment was cancelled. Your bag is saved." : null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  if (!ready) return <div className="skeleton h-96 rounded-2xl" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-2xl">Your bag is empty.</h2>
        <Link href="/shop" className="btn btn-primary mt-8">Shop the collection</Link>
      </div>
    );
  }

  const shipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "").trim();

    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const result = await placeOrder({
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        guestEmail: signedInEmail ? undefined : get("email"),
        couponCode: get("coupon") || undefined,
        address: {
          fullName: get("fullName"),
          line1: get("line1"),
          line2: get("line2"),
          city: get("city"),
          region: get("region"),
          postalCode: get("postalCode"),
          country: get("country").toUpperCase(),
          phone: get("phone"),
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Stripe-hosted page for card payments, or our confirmation page for demo orders.
      // Clear the bag only once we are about to leave this page.
      clear();
      window.location.assign(result.redirectTo);
    });
  };

  const field = (id: string, label: string, opts: { required?: boolean; type?: string; autoComplete?: string; defaultValue?: string; maxLength?: number; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={id} className="field-label">{label}{opts.required && " *"}</label>
      <input
        id={id}
        name={id}
        type={opts.type ?? "text"}
        required={opts.required}
        autoComplete={opts.autoComplete}
        defaultValue={opts.defaultValue}
        maxLength={opts.maxLength}
        placeholder={opts.placeholder}
        aria-invalid={Boolean(fieldErrors[id])}
        aria-describedby={fieldErrors[id] ? `${id}-error` : undefined}
        className="input"
      />
      {fieldErrors[id] && <p id={`${id}-error`} className="mt-1 text-xs text-danger">{fieldErrors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate={false} className="grid gap-12 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <section aria-labelledby="contact-h">
          <h2 id="contact-h" className="text-2xl">Contact</h2>
          <div className="mt-6">
            {signedInEmail ? (
              <p className="text-sm text-muted">Receipt will be sent to <span className="text-bone">{signedInEmail}</span>.</p>
            ) : (
              field("email", "Email for receipt", { required: true, type: "email", autoComplete: "email" })
            )}
          </div>
        </section>

        <section aria-labelledby="ship-h">
          <h2 id="ship-h" className="text-2xl">Shipping address</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("fullName", "Full name", { required: true, autoComplete: "name" })}</div>
            <div className="sm:col-span-2">{field("line1", "Address line 1", { required: true, autoComplete: "address-line1" })}</div>
            <div className="sm:col-span-2">{field("line2", "Address line 2", { autoComplete: "address-line2" })}</div>
            {field("city", "City", { required: true, autoComplete: "address-level2" })}
            {field("region", "State / region", { autoComplete: "address-level1" })}
            {field("postalCode", "Postal code", { required: true, autoComplete: "postal-code" })}
            {field("country", "Country code (e.g. US)", { required: true, autoComplete: "country", maxLength: 2 })}
            <div className="sm:col-span-2">{field("phone", "Phone (for delivery)", { type: "tel", autoComplete: "tel" })}</div>
          </div>
        </section>

        <section aria-labelledby="pay-h">
          <h2 id="pay-h" className="text-2xl">Payment</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            You&rsquo;ll pay on Stripe&rsquo;s secure page. Card details never reach our servers.
          </p>
        </section>
      </div>

      <aside aria-labelledby="sum-h" className="card h-fit p-7 lg:col-span-5">
        <h2 id="sum-h" className="text-xl">Your order</h2>
        <ul className="mt-5 divide-y divide-line text-sm">
          {lines.map((l) => (
            <li key={l.variantId} className="flex justify-between py-3">
              <span className="pr-4">{l.name} <span className="text-muted">· {l.color}, {l.size} × {l.quantity}</span></span>
              <span>{formatMoney(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <label htmlFor="coupon" className="field-label">Discount code</label>
          <div className="flex gap-2">
            <input id="coupon" name="coupon" className="input uppercase" placeholder="WELCOME10" />
          </div>
        </div>

        <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatMoney(subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping)}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-muted">Final total, including any discount, is confirmed on the payment page.</p>

        {error && <p role="alert" className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary mt-6 w-full">
          {pending ? "Processing…" : "Continue to payment"}
        </button>
      </aside>
    </form>
  );
}
