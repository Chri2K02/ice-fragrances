# Go-Live Checklist

Everything remaining to take Ice Fragrances live. **All application code is shipped, merged, and verified on `master`** — nothing below is code work; it's configuration, secrets, DNS, data cleanup, and verification that requires Vercel/DNS access (Chris) or the production DB.

Owner key: **[Chris]** = needs Vercel/registrar access · **[lead]** = can run via prod `DATABASE_URL` · **[team]** = deputy/builder QA after deploy.

---

## 1. Vercel environment variables  [Chris]
Set in **both Production and Preview** unless noted.

- [ ] **`BETTER_AUTH_SECRET`** — the single switch that turns auth on. Generate: `openssl rand -base64 32`. Must be **identical** across prod + preview and **stable** (rotating it invalidates all sessions). Also signs the `order-access` cookie.
- [ ] **`GOOGLE_OAUTH_CLIENT_ID`** / **`GOOGLE_OAUTH_CLIENT_SECRET`** — confirm present in prod + preview (added earlier).
- [ ] **`NEXT_PUBLIC_SITE_URL`** = `https://www.icefragrances.com` (canonical is **www**).
- [ ] Confirm existing: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`, Meta Pixel vars, `MIGRATE_SECRET`.
- [ ] **Remove the dead Clerk vars** — Clerk is fully retired: delete `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and any other `CLERK_*` / `NEXT_PUBLIC_CLERK_*`.
- [ ] Optional: `BETTER_AUTH_URL` (defaults from request host), `NEXT_PUBLIC_BETTER_AUTH_URL`.

## 2. Google OAuth Console (goal 1b)  [Chris]
- [ ] Authorized **JavaScript origins**: `https://www.icefragrances.com`, `http://localhost`.
- [ ] Authorized **redirect URIs**: `https://www.icefragrances.com/api/auth/callback/google`, `http://localhost/api/auth/callback/google` (portless localhost is intentional).
- [ ] OAuth **consent screen** published (not "Testing" — or real users get blocked). Scopes: email + profile only (this is the sign-in client; keep Gmail scopes off it).

## 3. Security cleanup (post env-export)  [Chris]
The one-shot `/api/oneshot-env-export` route was used once and reverted; the route is gone from `master`, but:
- [ ] **Delete the Vercel deployment(s)** built while that route existed (between PR #9/#10 and the #11 revert) — their immutable URLs still serve it (owner-gated, but close it).
- [ ] **Rotate** every secret that passed through the export download: **Stripe** (secret key), **`DATABASE_URL`** (reset the Neon role password), **Resend** API key, **Google** OAuth client secret. (Clerk is moot — being removed.)
- [ ] Update the rotated values in Vercel (+ anyone's local `.env.local`).

## 4. Email deliverability — Resend domain auth (SPF / DKIM / DMARC)  [Chris]
Order-confirmation and Better Auth OTP emails go through Resend (`lib/email.ts`). Without domain auth they land in spam or fail. In the **Resend dashboard**, add domain `icefragrances.com`, then add the DNS records it generates at the registrar:
- [ ] **Domain added + verified** in Resend (status: Verified).
- [ ] **SPF** — the `TXT` record Resend provides (Resend sends via Amazon SES; typically `v=spf1 include:amazonses.com ~all` on the send subdomain). If an SPF record already exists, **merge** the include into the one record (don't add a second SPF TXT).
- [ ] **DKIM** — the CNAME record(s) Resend provides (e.g. `resend._domainkey…`) for DKIM signing.
- [ ] **Return-Path / MX** — the `MX` (+ TXT) record Resend provides for the bounce subdomain, if listed.
- [ ] **DMARC** — add `TXT` at `_dmarc.icefragrances.com`. Start in monitor mode: `v=DMARC1; p=none; rua=mailto:dmarc@icefragrances.com;` then tighten to `p=quarantine` → `p=reject` after a week of clean reports. (DMARC passes on SPF **or** DKIM alignment — both set up above.)
- [ ] **`EMAIL_FROM`** = a verified-domain address, e.g. `Ice Fragrances <orders@icefragrances.com>` (not a gmail/unverified address).
- [ ] **Verify:** send a test order-confirmation + a test OTP; confirm inbox (not spam) and that headers pass SPF + DKIM + DMARC (e.g. mail-tester.com or Gmail "Show original").

## 5. Database cleanup — drop `clerk_user_id`  [lead]
The Clerk→Better Auth migration left `clerk_user_id` on `orders` + `reviews`. 3 orphan rows (deleted Clerk users) block a clean drop:
- [ ] **Delete** the 2 test rows: `orders` #7 + `reviews` #7 ("Tommy Grant", store's own email `icefragrances@icefragrances.com`).
- [ ] **Decide** `reviews` #5 (Calvin Ocampo, 5★ Iceberg — looks like a real customer): if test → delete; if real → `UPDATE reviews SET clerk_user_id = NULL` (keeps the review, clears the dead link).
- [ ] Verify gate: `clerk_user_id IS NOT NULL AND user_id IS NULL` → **0** rows on both tables.
- [ ] `ALTER TABLE orders DROP COLUMN clerk_user_id;` · `ALTER TABLE reviews DROP COLUMN clerk_user_id;` (+ remove from `lib/db/schema.ts`).

## 6. Post-deploy verification (live e2e)  [team]
After §1–§3 are live and a fresh prod deploy is up:
- [ ] **Auth:** Google sign-in; email/password sign-up → OTP email → verify → signed in; sign-out; session gating redirects on `/account` + `/admin` (admin = `ADMIN_EMAIL`).
- [ ] **Checkout:** place a test-card order; embedded Stripe completes; webhook records the order; confirmation email arrives.
- [ ] **Gated success:** `/success?orderNumber=N` — owner/cookie sees the real summary; a fresh browser sees the blurred placeholder + sign-up CTA; Purchase pixel fires once.
- [ ] **Reviews:** a verified buyer can post; admin can moderate/reply.
- [ ] **SEO/PageSpeed:** re-run PageSpeed on the live www URL; confirm canonical/robots/sitemap serve `www`.

## 7. Deferred (recorded, non-blocking)
Not required for go-live; revisit later.
- [ ] **Perf P0:** hero video `cloudnine.mp4` is ~7 MB and the LCP element (LCP ~5.4s) — poster-first + harder ffmpeg recompress. Collapse the apex→www redirect chain to ≤1 hop.
- [ ] **a11y:** `aria-hidden` elements with focusable descendants; touch-target sizing; `<track kind="captions">` on `<video>`.
- [ ] **SEO depth:** per-product `Product`/`AggregateRating` rich results (needs visible ratings); consider **Google Seller Ratings** / a third-party review platform for external trust.
- [ ] `/api/admin/send-confirmation` is `MIGRATE_SECRET`-gated (not a regression) — optionally also gate via `getSession()` + `ADMIN_EMAIL`.
