# Ice Fragrances — One-Page Store (Design Spec)

**Date:** 2026-06-05
**Status:** Approved design, pending implementation plan

## Overview

A single-page e-commerce website for **Ice Fragrances**, a premium cologne brand
(plus one humidifier product). The page is video-forward: a hero brand video and
one looping video per product. Visitors can browse, add items to a cart, and check
out via Stripe. The site supports light and dark modes.

## Goals

- One-page, video-forward, premium feel that justifies $108 pricing.
- Real online selling via Stripe Checkout (cards, shipping address, tax).
- Fast load despite heavy video source files.
- Light/dark mode with brand-correct logo per mode.

## Non-Goals (YAGNI)

- No user accounts / login.
- No product reviews, blog, or additional pages.
- No custom order-management dashboard — Stripe's dashboard handles orders.
- No inventory tracking system (manual for now).
- No broad internationalization — ships to US + Canada only at launch.

## Tech Stack

- **Framework:** Next.js (App Router), React, TypeScript.
- **Styling:** Tailwind CSS (fast, theme-friendly via CSS variables / `dark` class).
- **Payments:** Stripe Checkout via a Next.js serverless API route that creates
  Checkout Sessions server-side (secret key never exposed to the browser).
- **Hosting:** Vercel (free tier, global CDN). Custom domain attached.
- **Video:** Compressed once with ffmpeg, self-hosted in the app and served from
  Vercel's CDN.

## Architecture

```
Browser (one page)
  ├─ Theme toggle (light/dark, persisted in localStorage)
  ├─ Hero video (CloudNine, autoplay/loop/muted, unmute toggle)
  ├─ Product cards ×5 (video ⇄ photo toggle, unmute, Add to Cart)
  ├─ Cart drawer (client state) ──▶ POST /api/checkout
  │
  └─ /api/checkout (serverless)
        └─ Stripe SDK → create Checkout Session → return session URL
                          │
                          ▼
                 Stripe-hosted Checkout (address, payment)
                          │
                          ├─ success ▶ /success (or ?status=success)
                          └─ cancel  ▶ back to page
```

### Component breakdown (each unit has one clear purpose)

- **`ThemeProvider` / theme toggle** — owns light/dark state, persists choice,
  swaps the logo asset and CSS variables. Depends on: localStorage.
- **`HeroVideo`** — renders CloudNine video, autoplay/loop/muted/playsinline,
  unmute button. Depends on: video asset, poster image.
- **`ProductCard`** — one per product. Owns its own video⇄photo toggle (arrow),
  per-video unmute state, and "Add to Cart" action. Props: product data
  (name, price, video src, photo src, poster). Depends on: cart store.
- **`VideoPlayer`** (shared) — reusable looping/muted/lazy-played video used by
  both hero and cards. Uses IntersectionObserver to play only when on screen.
  One clear job: present a muted autoplay loop with an unmute control.
- **`CartDrawer`** — slide-out cart UI. Reads cart store, shows line items +
  total, "Checkout" button that calls the checkout API and redirects.
- **`cartStore`** — client state (items, quantities, add/remove, total). Single
  source of truth for cart contents.
- **`/api/checkout`** — serverless route. Input: cart line items. Output: Stripe
  Checkout Session URL. Validates prices server-side against the product config
  (never trusts client-sent prices).
- **`products` config** — single data file listing all products (id, name,
  price, Stripe price id / amount, asset paths). Source of truth for the grid
  and for server-side price validation.

## Page Structure (top → bottom)

1. **Header** — logo (mode-appropriate), light/dark toggle, cart icon (count).
2. **Hero** — CloudNine video (autoplay, loop, muted, unmute button), brand
   tagline, "Shop" button that scrolls to products.
3. **Products** — 5 cards: Frost, Glacier, Hailstone, Iceberg ($108 each, free
   shipping) and Humidifier ($38). Each card: looping muted video + unmute
   toggle, arrow to flip video ⇄ product photo, name, price, Add to Cart.
4. **Cart drawer** — opens from header; line items, total, Checkout → Stripe.
5. **Footer** — brand mark, contact, socials.

## Theming

| Mode  | Background | Text  | Accent        | Logo asset                          |
|-------|-----------|-------|---------------|-------------------------------------|
| Light | White     | Black | Sky blue      | `BlackLettersWhiteBackground.png`   |
| Dark  | Black     | White | Sky blue      | `WhiteLettersTransparentBackground.png` |

- Accent blue matches the logo's existing cube/droplet blue in both modes.
- Toggle lives in the header; choice persists in localStorage; respects the
  visitor's OS preference on first visit.
- **Dark-mode logo note:** the icon keeps black outlines that can disappear on
  pure black. Fix at build time — place it on the frosted-glass header and/or
  add a subtle outline/glow so it stays crisp. Flag if it needs a decision.

## Products & Assets

Source assets currently in `C:\Users\ckear\Downloads\icefrag\`.

| Display name        | For sale | Price | Video                          | Photo                  |
|---------------------|----------|-------|--------------------------------|------------------------|
| (CloudNine hero)    | No (hero only) | —  | `CloudNine.mp4`                | — (none)               |
| Frost Mind          | Yes      | $108  | `FrostMind.mp4`                | `FrostThumbnail.jpg`   |
| Glacier Hours       | Yes      | $108  | `GlacierHours.mp4`             | `GlacierThumbnail.jpg` |
| Hailstone Wildflower| Yes      | $108  | `HailstoneWildflowerFinal.mp4` | `HailstoneThumbnail.jpg` |
| Iceberg Embrace     | Yes      | $108  | `IcebergEmbrace.mp4`           | `IcebergThumbnail.jpg` |
| Humidifier          | Yes      | $38   | `HumidiferAdFinal.mp4`         | `Edit1.jpg`            |

- Colognes: **$108**. Humidifier: **$38**. **Free shipping on all** to US + Canada.
- Display names use the longer product names (above), per user.

## Video Handling (Performance)

- Source videos total 600 MB+ (CloudNine alone is 256 MB) — too large to ship.
- **Compress once** with ffmpeg to web-optimized H.264 MP4 (target ~1080p,
  sensible bitrate; aim ~5–15 MB each). Optionally add WebM for smaller size.
- **Lazy-load**: videos use IntersectionObserver — only play when on screen;
  pause/unload off-screen. Thumbnails serve as instant `poster` images.
- Hero may use a trimmed loop if the full CloudNine clip is long.
- Migration path: if traffic grows, move to a video CDN (Cloudflare Stream /
  Bunny) without changing the component API.

## Commerce / Stripe Flow

1. Visitor adds items to the cart (client `cartStore`).
2. Checkout button POSTs line items to `/api/checkout`.
3. Server validates each item against the `products` config, builds a Stripe
   Checkout Session (line items, shipping address collection = US + Canada,
   shipping rate = $0 free), returns the session URL.
4. Browser redirects to Stripe-hosted Checkout.
5. On success → success state/page; on cancel → return to page with cart intact.
6. Orders + customer/shipping details appear in the Stripe dashboard; Stripe
   sends receipt emails.

## Error Handling

- Video fails to load → show poster image, hide unmute control.
- Checkout API error → toast/message, keep cart contents, allow retry.
- Server rejects mismatched/invalid prices (anti-tamper) → 400, generic message.
- Empty cart → Checkout button disabled.

## Testing

- Unit: `cartStore` (add/remove/total), price validation in `/api/checkout`.
- Component: `ProductCard` video⇄photo toggle and unmute; theme toggle persistence.
- Integration: checkout API creates a session with correct amounts (Stripe test mode).
- Manual/QA: autoplay + unmute on desktop and mobile; light/dark across sections;
  full purchase in Stripe test mode.

## Deployment

- Vercel project, environment variables for Stripe keys (test + live).
- Custom domain: **icefragrances.com** (already owned).
- Stripe in test mode until launch, then switch to live keys.

## Open Items (to confirm during/after spec review)

1. ~~Domain name~~ — **icefragrances.com** (confirmed).
2. ~~Humidifier shipping~~ — **free** (confirmed).
3. ~~Shipping region~~ — **US + Canada**, free shipping on all (confirmed).
4. ~~Product display names~~ — **longer names** (Frost Mind, Glacier Hours,
   Hailstone Wildflower, Iceberg Embrace, Humidifier) (confirmed).
5. **Dark-mode logo polish** — confirm approach if the default (frosted header /
   subtle glow) needs adjusting.
