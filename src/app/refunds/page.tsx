import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Returns & refunds" };

export default function RefundsPage() {
  return (
    <LegalPage title="Returns & refunds" updated="2026-10-11">
      <p><strong>Draft policy. Confirm the window and conditions with your legal adviser.</strong></p>
      <h2>Thirty-day returns</h2>
      <p>Return unworn items with original tags within 30 days of delivery for a full refund to your original payment method.</p>
      <h2>Faulty or incorrect items</h2>
      <p>If an item is faulty or not what you ordered, contact us within 14 days and we will arrange a replacement or refund, including return shipping.</p>
      <h2>Non-refundable items</h2>
      <p>Gift cards and items marked final sale cannot be returned.</p>
      <h2>Refund timing</h2>
      <p>We process refunds within five business days of receiving the item. Your bank may take additional time to show the credit.</p>
    </LegalPage>
  );
}
