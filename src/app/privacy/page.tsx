import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="2026-10-11">
      <p>
        This policy explains what personal data Atelier collects, why, and the rights you have under the GDPR and the
        CCPA. <strong>Draft: have a qualified lawyer review this before launch.</strong>
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email address, and a salted password hash (or your Google profile if you sign in with Google).</li>
        <li>Order details: shipping address, items, and totals. Payment card data is handled only by Stripe.</li>
        <li>Technical data: strictly necessary cookies for sign-in, your bag and your consent choice. Analytics only with consent.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>To run your account, fulfil orders, send receipts and security notices, prevent fraud, and improve the store when you have agreed.</p>
      <h2>Processors</h2>
      <p>Stripe (payments), Resend (transactional email), and our hosting provider. Each is bound by a data processing agreement.</p>
      <h2>Your rights</h2>
      <p>You may request access, correction, export or deletion of your data at any time, and withdraw consent for analytics from the cookie banner. Email privacy@example.com to make a request.</p>
      <h2>Retention</h2>
      <p>Order records are kept for the period required by tax law. Account data is removed on request, subject to those obligations.</p>
    </LegalPage>
  );
}
