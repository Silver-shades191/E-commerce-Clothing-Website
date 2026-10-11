"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAddress, saveAddress, updateName } from "@/actions/account";
import { signOutAction } from "@/actions/session";

export function NameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateName(name);
          setMessage(res.ok ? "Saved." : res.error);
        });
      }}
    >
      <div className="flex-1">
        <label htmlFor="display-name" className="field-label">Display name</label>
        <input id="display-name" value={name} onChange={(e) => setName(e.target.value)} className="input" maxLength={80} />
      </div>
      <button type="submit" disabled={pending} className="btn btn-outline">Save</button>
      {message && <p role="status" className="text-sm text-muted sm:self-center">{message}</p>}
    </form>
  );
}

export function AddressForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const field = (id: string, label: string, opts: { required?: boolean; autoComplete?: string; maxLength?: number } = {}) => (
    <div>
      <label htmlFor={`addr-${id}`} className="field-label">{label}{opts.required && " *"}</label>
      <input id={`addr-${id}`} name={id} required={opts.required} autoComplete={opts.autoComplete} maxLength={opts.maxLength} className="input" />
    </div>
  );
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const get = (k: string) => String(f.get(k) ?? "").trim();
        start(async () => {
          const res = await saveAddress({
            fullName: get("fullName"),
            line1: get("line1"),
            line2: get("line2"),
            city: get("city"),
            region: get("region"),
            postalCode: get("postalCode"),
            country: get("country").toUpperCase(),
            phone: get("phone"),
          });
          if (!res.ok) setError(res.error);
          else {
            setError(null);
            e.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="sm:col-span-2">{field("fullName", "Full name", { required: true, autoComplete: "name" })}</div>
      <div className="sm:col-span-2">{field("line1", "Address line 1", { required: true, autoComplete: "address-line1" })}</div>
      <div className="sm:col-span-2">{field("line2", "Address line 2", { autoComplete: "address-line2" })}</div>
      {field("city", "City", { required: true, autoComplete: "address-level2" })}
      {field("region", "State / region", { autoComplete: "address-level1" })}
      {field("postalCode", "Postal code", { required: true, autoComplete: "postal-code" })}
      {field("country", "Country code", { required: true, autoComplete: "country", maxLength: 2 })}
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary">Save address</button>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}

export function DeleteAddressButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => { await deleteAddress(id); router.refresh(); })}
      className="text-sm text-muted hover:text-danger"
    >
      Remove
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn btn-outline">Sign out</button>
    </form>
  );
}
