"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { register, requestPasswordReset, resetPassword, resendVerification, type ActionState } from "@/actions/auth";
import { loginAction, googleSignInAction } from "@/actions/session";

const initial: ActionState = { ok: false };

function Alert({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-xl border p-3 text-sm ${
        state.ok ? "border-success/40 bg-success/10 text-success" : "border-danger/40 bg-danger/10 text-danger"
      }`}
    >
      {state.message}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <div className="space-y-6">
      <form action={action} className="space-y-5" noValidate={false}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field id="email" label="Email">
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </Field>
        <Field id="password" label="Password">
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </Field>
        <div className="flex justify-end">
          <Link href="/reset-password" className="text-sm text-muted underline-offset-4 hover:text-gold hover:underline">
            Forgot password?
          </Link>
        </div>
        <Alert state={state} />
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form action={googleSignInAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button type="submit" className="btn btn-outline w-full">Continue with Google</button>
      </form>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial);
  if (state.ok && state.message) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-2xl">Check your inbox</h2>
        <p className="mt-3 text-muted">{state.message}</p>
        <ResendForm />
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <Field id="name" label="Full name" error={state.errors?.name}>
        <input id="name" name="name" required autoComplete="name" className="input" aria-invalid={Boolean(state.errors?.name)} />
      </Field>
      <Field id="email" label="Email" error={state.errors?.email}>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" aria-invalid={Boolean(state.errors?.email)} />
      </Field>
      <Field id="password" label="Password" error={state.errors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          aria-describedby="password-hint"
          aria-invalid={Boolean(state.errors?.password)}
          className="input"
        />
      </Field>
      <p id="password-hint" className="text-xs text-muted">At least 12 characters, with upper and lower case letters and a number.</p>
      {state.message && !state.ok && <Alert state={state} />}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function ResendForm() {
  const [state, action, pending] = useActionState(resendVerification, initial);
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-6 text-sm text-gold underline-offset-4 hover:underline">Didn&rsquo;t get it? Resend</button>;
  }
  return (
    <form action={action} className="mt-6 space-y-3 text-left">
      <Field id="resend-email" label="Email">
        <input id="resend-email" name="email" type="email" required className="input" />
      </Field>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-outline w-full">Send new link</button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="space-y-5">
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </Field>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">Send reset link</button>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [state, action, pending] = useActionState(resetPassword, initial);
  if (state.ok) {
    return (
      <div className="space-y-6">
        <Alert state={state} />
        <Link href="/login" className="btn btn-primary w-full">Sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <Field id="password" label="New password">
        <input id="password" name="password" type="password" required minLength={12} autoComplete="new-password" className="input" />
      </Field>
      <Alert state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary w-full">Update password</button>
    </form>
  );
}
