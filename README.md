# Atelier — luxury shirts & tees

A full e-commerce storefront and back office built with Next.js 16 (App Router), React 19, Tailwind CSS v4,
Drizzle ORM on libSQL/SQLite (or Turso in production), Auth.js v5, Stripe Checkout, and Resend.

> The brand name "Atelier" is a placeholder. Rename it in `src/app/layout.tsx`, `src/components/header.tsx`,
> and the legal pages.

## Quick start

```bash
npm install
cp .env.example .env.local        # then set AUTH_SECRET (openssl rand -base64 32)
npm run setup                     # creates the database, applies the schema, seeds sample data
npm run dev                       # http://localhost:3000
```

The seed prints a random admin password once. Set `SEED_ADMIN_PASSWORD` in `.env.local` if you want a fixed one.

Without `STRIPE_SECRET_KEY`, checkout uses a **demo payment** that confirms the order immediately, so the full
order path can be tested locally. Demo payments are refused when `NODE_ENV=production`.

Without `RESEND_API_KEY`, verification and reset links are printed to the server console.

## Roles

| Role     | Storefront | Orders / stock | Users / roles | Coupons |
|----------|:----------:|:--------------:|:-------------:|:-------:|
| customer | yes        | no             | no            | no      |
| support  | yes        | yes            | no            | no      |
| admin    | yes        | yes            | yes           | yes     |

Access is enforced on the server (`src/app/admin/layout.tsx`, `src/lib/guard.ts`), not just by hiding links.

## Architecture

```
src/
  auth.ts                 Auth.js config: credentials, Google OAuth, lockout, role in JWT
  db/schema.ts            Drizzle schema (users, products, variants, orders, coupons, ...)
  actions/                Server actions: auth, checkout, account, admin (all re-validate input)
  lib/
    catalog.ts            Search, filters, sorting, pagination, product detail
    orders.ts             fulfillOrder(): idempotent paid transition, stock decrement, email
    rate-limit.ts         Fixed-window limiter (in-memory; see production notes)
    email.ts              Resend templates: verify, reset, order confirmation
    redirect.ts           Open-redirect guard for callbackUrl
  app/
    api/webhooks/stripe   Verified webhook: the only path that marks card orders paid
    ...                   storefront, account, admin pages
  components/             UI. Design tokens live in app/globals.css
```

### Design system

Colours, type, radius, shadow and motion are defined once as Tailwind v4 theme tokens in `src/app/globals.css`
(`--color-gold`, `--font-display`, `--radius-card`, `--ease-lux`, and so on). Buttons, inputs, cards, chips
and loading skeletons are shared component classes. A light scheme is defined under `[data-theme="light"]`.
Motion is disabled under `prefers-reduced-motion`. Focus rings are visible on all interactive elements.

The visual direction is inspired by premium retail sites. Nothing is copied from any brand. Replace the
placeholder art and copy with your own.

### Security measures in code

- Passwords hashed with bcrypt (cost 12). Minimum 12 characters with mixed case and a digit.
- Account lockout for 15 minutes after 5 failed sign-ins. Per-IP and per-email rate limits on login,
  registration, resend and reset.
- Generic error messages on sign-in, registration and reset, to prevent account enumeration.
- Verification and reset tokens are random, stored only as SHA-256 hashes, single-use and time-limited.
- Sessions are signed, HTTP-only JWTs with a 7-day lifetime. Secure cookies are used automatically over HTTPS.
- Checkout re-prices every line from the database. Client prices, client stock claims and coupon values
  are never trusted.
- Orders are marked paid only from a verified Stripe webhook (`checkout.session.completed` with
  `payment_status = paid`), and processing is idempotent.
- Card data never touches the app. Stripe Checkout keeps the store in the lightest PCI scope (SAQ A).
- Drizzle parameterises every query, and React escapes output, which protects against SQL injection and XSS.
- Security headers in `next.config.ts`: CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, a strict referrer
  policy and a restricted permissions policy.
- Server actions validate with Zod and check roles before doing anything.

## Environment variables

See `.env.example`. Required in production: `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
(if using Turso), `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.

Google sign-in is enabled when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Add the redirect URI
`{APP_URL}/api/auth/callback/google` in Google Cloud Console. Only Google accounts with a verified email are accepted.

## Deployment guide (Vercel + Turso + Stripe + Resend)

1. **Database.** Create a Turso database. Set `DATABASE_URL=libsql://<db>-<org>.turso.io` and
   `DATABASE_AUTH_TOKEN`. Run `DATABASE_URL=... DATABASE_AUTH_TOKEN=... npm run db:push` once.
   Do not seed the production database with the demo admin. Create the first admin with the seed script
   using a strong `SEED_ADMIN_PASSWORD`, then change the password.
2. **Email.** Verify your sending domain in Resend. Set `EMAIL_FROM` to an address on that domain.
3. **Stripe.** Create a webhook endpoint at `{APP_URL}/api/webhooks/stripe` listening for
   `checkout.session.completed` and `checkout.session.expired`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.
4. **Hosting.** Import the repository into Vercel. Add all variables from `.env.example`. Deploy.
5. **Rate limits.** The in-memory limiter is per instance. For more than one instance, replace
   `src/lib/rate-limit.ts` with Redis (for example Upstash).
6. **Smoke test.** Register, verify, buy with Stripe test card `4242 4242 4242 4242`, check the webhook
   delivery, and confirm the stock decrement and the receipt email.

## Testing

Current verification:

- `tsc --noEmit` passes. `next build` compiles every route.
- Route smoke tests: public pages return 200, unknown routes return 404, and protected routes redirect to login.
- Auth: wrong password is rejected, correct credentials create a session with the admin role, and admin pages
  load only with that session.

Still to do before launch:

- Playwright E2E for signup, email verification, login, checkout (Stripe test mode), and admin CRUD.
  Add `tests/e2e/` and run `npx playwright test`.
- Cross-browser runs (Chrome, Safari, Firefox, Edge) and mobile, tablet and desktop viewports.
- Lighthouse for performance, accessibility and SEO on the home, shop and product pages.
- Unit tests for `formatMoney`, coupon maths, `safeCallback` and the rate limiter (Vitest).

## Known gaps (planned, not yet built)

- **MFA / 2FA (TOTP)** is not implemented yet. Add `otpauth`, store an encrypted secret per user, and add a
  second step to the credentials flow.
- **Cookie consent** records the choice. Analytics scripts must still check `getConsent()` before loading.
- **Currency.** Prices are in USD. PKR is possible if your Stripe account supports it for your region.
- **Inventory reservation.** Stock is checked at checkout and decremented when payment is confirmed. Two
  buyers can race for the last unit, so the second payment may need a manual refund. Reserve stock on
  checkout creation for high traffic.
- **Product images.** The catalogue shows a typographic placeholder until image URLs are added in admin.
- **Legal text** in `/privacy`, `/terms` and `/refunds` is a drafted starting point and must be reviewed by a lawyer.
- **Logging and monitoring.** Add Sentry or similar before launch.
- **GDPR data export and deletion** requests need an endpoint. Right now they are handled by email.
