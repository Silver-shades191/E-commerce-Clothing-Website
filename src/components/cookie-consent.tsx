"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "atelier.consent.v1";
export type Consent = { necessary: true; analytics: boolean; marketing: boolean; at: string };

// Only strictly necessary cookies (session, cart, consent itself) are set by default.
// Analytics and marketing scripts must check getConsent() before loading.
export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Consent) : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(getConsent() === null);
  }, []);

  if (!show) return null;

  const save = (analytics: boolean, marketing: boolean) => {
    const consent: Consent = { necessary: true, analytics, marketing, at: new Date().toISOString() };
    try {
      localStorage.setItem(KEY, JSON.stringify(consent));
    } catch {
      /* storage unavailable: banner will reappear next visit */
    }
    setShow(false);
  };

  return (
    <section
      aria-labelledby="cookie-title"
      className="fade-up fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-line bg-raised/95 p-5 shadow-lift backdrop-blur md:p-6"
    >
      <h2 id="cookie-title" className="font-display text-lg">Your privacy</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        We use strictly necessary cookies to run the store. With your permission we also use analytics to improve it.
        Read our <Link href="/privacy" className="text-gold underline-offset-4 hover:underline">privacy policy</Link>.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => save(false, false)} className="btn btn-outline">Necessary only</button>
        <button type="button" onClick={() => save(true, false)} className="btn btn-primary">Accept all</button>
      </div>
    </section>
  );
}
