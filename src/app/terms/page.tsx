import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="2026-10-11">
      <p><strong>Draft: have a qualified lawyer review these terms before launch.</strong></p>
      <h2>Orders</h2>
      <p>An order is accepted when payment is confirmed. We may cancel an order if stock or pricing was entered in error, and refund you in full.</p>
      <h2>Pricing</h2>
      <p>Prices are shown in USD and include applicable taxes where stated. Discount codes are subject to their own conditions.</p>
      <h2>Accounts</h2>
      <p>You are responsible for keeping your credentials confidential. Tell us promptly if you suspect unauthorised access.</p>
      <h2>Acceptable use</h2>
      <p>Do not attempt to disrupt the service, scrape customer data, or misuse discount codes. Reviews must be your own honest experience.</p>
      <h2>Liability</h2>
      <p>To the extent permitted by law, our liability is limited to the amount you paid for the order in question. Nothing here limits rights you have as a consumer.</p>
      <h2>Governing law</h2>
      <p>Specify the governing law and courts appropriate to your business before launch.</p>
    </LegalPage>
  );
}
