"use client";

import { useState, useTransition } from "react";
import { submitReview } from "@/actions/account";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await submitReview({ productId, rating, title, body });
          setMessage(res.ok ? { ok: true, text: "Thank you — your review is published." } : { ok: false, text: res.error });
          if (res.ok) {
            setTitle("");
            setBody("");
          }
        });
      }}
    >
      <div>
        <label htmlFor="rating" className="field-label">Rating</label>
        <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="review-title" className="field-label">Title</label>
        <input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="input" />
      </div>
      <div>
        <label htmlFor="review-body" className="field-label">Review</label>
        <textarea id="review-body" required minLength={10} maxLength={2000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-outline w-full">
        {pending ? "Posting…" : "Post review"}
      </button>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}>{message.text}</p>
      )}
    </form>
  );
}
