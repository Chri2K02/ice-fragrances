# Ice Fragrances Store — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-page, video-forward e-commerce site for Ice Fragrances with light/dark mode, looping muted product videos (video⇄photo arrow toggle), a cart drawer, and Stripe Checkout.

**Architecture:** Next.js (App Router) single page. Client components handle videos, theme, and cart state (Zustand). A serverless route (`/api/checkout`) builds a Stripe Checkout Session from a server-validated product config. Videos are compressed with ffmpeg and self-hosted in `public/`, lazy-played via IntersectionObserver.

**Tech Stack:** Next.js 15 + React + TypeScript, Tailwind CSS, `next-themes` (light/dark), Zustand (cart), Stripe Node SDK, Vitest + React Testing Library + jsdom (tests). Deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-06-05-ice-fragrances-design.md`

---

## File Structure

```
ice-fragrances/
  app/
    layout.tsx              # root layout, ThemeProvider, metadata
    page.tsx                # the single page: Header, Hero, Products, Footer, CartDrawer
    globals.css             # Tailwind + theme CSS variables
    api/checkout/route.ts   # POST -> Stripe Checkout Session
    success/page.tsx        # post-checkout success
  components/
    Header.tsx              # logo (per theme) + theme toggle + cart button
    ThemeToggle.tsx         # light/dark switch
    Logo.tsx                # renders correct logo asset for current theme
    HeroVideo.tsx           # CloudNine hero
    VideoPlayer.tsx         # shared muted autoplay loop + unmute + lazy play
    ProductCard.tsx         # one product: video<->photo arrow, add to cart
    Products.tsx            # grid of ProductCards
    CartDrawer.tsx          # slide-out cart -> checkout
    Footer.tsx
  lib/
    products.ts             # product config (source of truth)
    cartStore.ts            # Zustand cart store
    checkout.ts             # buildLineItems() pure helper (server-side validation)
    theme.ts                # logoForTheme() pure helper
  lib/__tests__/
    cartStore.test.ts
    checkout.test.ts
    theme.test.ts
  components/__tests__/
    VideoPlayer.test.tsx
    ProductCard.test.tsx
  public/
    logo-light.png          # BlackLettersWhiteBackground.png (copied)
    logo-dark.png           # WhiteLettersTransparentBackground.png (copied)
    media/                  # compressed videos + poster jpgs
  scripts/
    compress-videos.sh      # ffmpeg compression
  .env.local                # STRIPE_SECRET_KEY, NEXT_PUBLIC_SITE_URL (gitignored)
  .env.example
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: project files via scaffold, plus `lib/products.ts`

- [ ] **Step 1: Scaffold Next.js with TypeScript + Tailwind**

Run from `C:\Users\ckear\ice-fragrances`:
```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --no-turbopack --use-npm
```
If prompted that the directory is not empty (it has `docs/` and `.git/`), choose to continue/overwrite — it will not touch `docs/`.

- [ ] **Step 2: Install runtime + test dependencies**

```bash
npm install zustand stripe next-themes
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify the project builds and tests run**

Run:
```bash
npm run build
npm test
```
Expected: build succeeds; `npm test` reports "No test files found" (exit 0) — that's fine, tests come next.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

### Task 2: Product config (source of truth)

**Files:**
- Create: `lib/products.ts`

- [ ] **Step 1: Write the product config**

Create `lib/products.ts`:
```ts
export type Product = {
  id: string;
  name: string;
  priceCents: number; // server-trusted price
  video: string; // path under /public
  poster: string; // path under /public
  blurb: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "frost-mind",
    name: "Frost Mind",
    priceCents: 10800,
    video: "/media/frost-mind.mp4",
    poster: "/media/frost-mind.jpg",
    blurb: "A crisp, clarifying cologne.",
  },
  {
    id: "glacier-hours",
    name: "Glacier Hours",
    priceCents: 10800,
    video: "/media/glacier-hours.mp4",
    poster: "/media/glacier-hours.jpg",
    blurb: "Cool, lasting, and deep.",
  },
  {
    id: "hailstone-wildflower",
    name: "Hailstone Wildflower",
    priceCents: 10800,
    video: "/media/hailstone-wildflower.mp4",
    poster: "/media/hailstone-wildflower.jpg",
    blurb: "Icy florals with a wild edge.",
  },
  {
    id: "iceberg-embrace",
    name: "Iceberg Embrace",
    priceCents: 10800,
    video: "/media/iceberg-embrace.mp4",
    poster: "/media/iceberg-embrace.jpg",
    blurb: "Bold, enveloping, unforgettable.",
  },
  {
    id: "humidifier",
    name: "Humidifier",
    priceCents: 3800,
    video: "/media/humidifier.mp4",
    poster: "/media/humidifier.jpg",
    blurb: "Keep the air cool and fresh.",
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/products.ts
git commit -m "feat: add product config"
```

---

### Task 3: Compress videos and stage assets

**Files:**
- Create: `scripts/compress-videos.sh`
- Add: `public/media/*.mp4`, `public/media/*.jpg`, `public/logo-light.png`, `public/logo-dark.png`

Source assets live in `C:\Users\ckear\Downloads\icefrag\`. Requires `ffmpeg` on PATH (`winget install Gyan.FFmpeg` if missing).

- [ ] **Step 1: Write the compression script**

Create `scripts/compress-videos.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
SRC="$HOME/Downloads/icefrag"
OUT="public/media"
mkdir -p "$OUT"

# args: <src-mp4> <out-name>
compress() {
  ffmpeg -y -i "$1" -vf "scale='min(1080,iw)':-2" \
    -c:v libx264 -preset slow -crf 28 -movflags +faststart \
    -c:a aac -b:a 96k "$OUT/$2.mp4"
}

compress "$SRC/Cloudnine/CloudNine.mp4" "cloudnine"
compress "$SRC/Frost/FrostMind.mp4" "frost-mind"
compress "$SRC/Glacier/GlacierHours.mp4" "glacier-hours"
compress "$SRC/Hailstone/HailstoneWildflowerFinal.mp4" "hailstone-wildflower"
compress "$SRC/Iceberg/IcebergEmbrace.mp4" "iceberg-embrace"
compress "$SRC/Humidifer/HumidiferAdFinal.mp4" "humidifier"

# Posters (resize thumbnails; CloudNine poster grabbed from its video)
cp "$SRC/Frost/FrostThumbnail.jpg" "$OUT/frost-mind.jpg"
cp "$SRC/Glacier/GlacierThumbnail.jpg" "$OUT/glacier-hours.jpg"
cp "$SRC/Hailstone/HailstoneThumbnail.jpg" "$OUT/hailstone-wildflower.jpg"
cp "$SRC/Iceberg/IcebergThumbnail.jpg" "$OUT/iceberg-embrace.jpg"
cp "$SRC/Humidifer/Edit1.jpg" "$OUT/humidifier.jpg"
ffmpeg -y -i "$SRC/Cloudnine/CloudNine.mp4" -vframes 1 -q:v 3 "$OUT/cloudnine.jpg"

echo "Done. Sizes:"
ls -lh "$OUT"
```

- [ ] **Step 2: Run the compression script**

Run (Git Bash, from project root):
```bash
bash scripts/compress-videos.sh
```
Expected: `public/media/` contains 6 `.mp4` (each roughly 3–15 MB) and 6 `.jpg`.

- [ ] **Step 3: Copy logos into public**

```bash
cp ~/Downloads/icefrag/BlackLettersWhiteBackground.png public/logo-light.png
cp ~/Downloads/icefrag/WhiteLettersTransparentBackground.png public/logo-dark.png
```

- [ ] **Step 4: Verify total media size is web-appropriate**

Run:
```bash
du -sh public/media
```
Expected: total well under 100 MB (ideally < 60 MB). If any single file is > 20 MB, re-run that one with `-crf 30`.

- [ ] **Step 5: Commit**

```bash
git add scripts/compress-videos.sh public/media public/logo-light.png public/logo-dark.png
git commit -m "feat: compress and stage video + logo assets"
```

---

### Task 4: Cart store (Zustand) — TDD

**Files:**
- Create: `lib/cartStore.ts`
- Test: `lib/__tests__/cartStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/cartStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCart } from "@/lib/cartStore";

describe("cartStore", () => {
  beforeEach(() => useCart.getState().clear());

  it("adds an item and computes the total", () => {
    useCart.getState().add("frost-mind");
    const s = useCart.getState();
    expect(s.items).toEqual([{ id: "frost-mind", qty: 1 }]);
    expect(s.totalCents()).toBe(10800);
  });

  it("increments quantity when the same item is added twice", () => {
    useCart.getState().add("humidifier");
    useCart.getState().add("humidifier");
    const s = useCart.getState();
    expect(s.items).toEqual([{ id: "humidifier", qty: 2 }]);
    expect(s.totalCents()).toBe(7600);
  });

  it("removes an item", () => {
    useCart.getState().add("frost-mind");
    useCart.getState().remove("frost-mind");
    expect(useCart.getState().items).toEqual([]);
  });

  it("counts total quantity", () => {
    useCart.getState().add("frost-mind");
    useCart.getState().add("humidifier");
    expect(useCart.getState().count()).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/cartStore.test.ts`
Expected: FAIL — cannot find module `@/lib/cartStore`.

- [ ] **Step 3: Implement the cart store**

Create `lib/cartStore.ts`:
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProduct } from "@/lib/products";

export type CartItem = { id: string; qty: number };

type CartState = {
  items: CartItem[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: () => number;
  totalCents: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (id) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { id, qty: 1 }] };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      totalCents: () =>
        get().items.reduce((sum, i) => {
          const p = getProduct(i.id);
          return sum + (p ? p.priceCents * i.qty : 0);
        }, 0),
    }),
    { name: "icefrag-cart" }
  )
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/cartStore.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/cartStore.ts lib/__tests__/cartStore.test.ts
git commit -m "feat: cart store with add/remove/total (tested)"
```

---

### Task 5: Checkout line-item builder (server validation) — TDD

**Files:**
- Create: `lib/checkout.ts`
- Test: `lib/__tests__/checkout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/checkout.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildLineItems } from "@/lib/checkout";

describe("buildLineItems", () => {
  it("builds Stripe line items from valid cart items", () => {
    const items = buildLineItems([{ id: "frost-mind", qty: 2 }]);
    expect(items).toEqual([
      {
        quantity: 2,
        price_data: {
          currency: "usd",
          unit_amount: 10800,
          product_data: { name: "Frost Mind" },
        },
      },
    ]);
  });

  it("throws on an unknown product id (anti-tamper)", () => {
    expect(() => buildLineItems([{ id: "free-stuff", qty: 1 }])).toThrow();
  });

  it("throws on a non-positive quantity", () => {
    expect(() => buildLineItems([{ id: "frost-mind", qty: 0 }])).toThrow();
  });

  it("throws on an empty cart", () => {
    expect(() => buildLineItems([])).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/checkout.test.ts`
Expected: FAIL — cannot find module `@/lib/checkout`.

- [ ] **Step 3: Implement the builder**

Create `lib/checkout.ts`:
```ts
import { getProduct } from "@/lib/products";
import type { CartItem } from "@/lib/cartStore";

export type StripeLineItem = {
  quantity: number;
  price_data: {
    currency: "usd";
    unit_amount: number;
    product_data: { name: string };
  };
};

export function buildLineItems(items: CartItem[]): StripeLineItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }
  return items.map((item) => {
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error(`Invalid quantity for ${item.id}`);
    }
    const product = getProduct(item.id);
    if (!product) {
      throw new Error(`Unknown product: ${item.id}`);
    }
    return {
      quantity: item.qty,
      price_data: {
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: { name: product.name },
      },
    };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/checkout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/checkout.ts lib/__tests__/checkout.test.ts
git commit -m "feat: server-side checkout line-item builder (tested)"
```

---

### Task 6: Checkout API route

**Files:**
- Create: `app/api/checkout/route.ts`
- Create: `.env.example`

- [ ] **Step 1: Add env example**

Create `.env.example`:
```
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
Then create `.env.local` with your real Stripe **test** secret key and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Confirm `.env.local` is gitignored (Next's default `.gitignore` includes `.env*`).

- [ ] **Step 2: Implement the route**

Create `app/api/checkout/route.ts`:
```ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buildLineItems } from "@/lib/checkout";
import type { CartItem } from "@/lib/cartStore";

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as { items: CartItem[] };
    const lineItems = buildLineItems(items);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
          },
        },
      ],
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

- [ ] **Step 3: Manually verify the route (Stripe test mode)**

Start dev server (`npm run dev`), then in another terminal:
```bash
curl -s -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[{"id":"frost-mind","qty":1}]}'
```
Expected: JSON with a `"url"` starting `https://checkout.stripe.com/`. A bad id returns `{"error": "..."}` with HTTP 400.

- [ ] **Step 4: Commit**

```bash
git add app/api/checkout/route.ts .env.example
git commit -m "feat: Stripe checkout session API route"
```

---

### Task 7: Theme helper + provider — TDD for the pure part

**Files:**
- Create: `lib/theme.ts`
- Test: `lib/__tests__/theme.test.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/theme.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { logoForTheme } from "@/lib/theme";

describe("logoForTheme", () => {
  it("uses the white-letter logo in dark mode", () => {
    expect(logoForTheme("dark")).toBe("/logo-dark.png");
  });
  it("uses the black-letter logo in light mode", () => {
    expect(logoForTheme("light")).toBe("/logo-light.png");
  });
  it("defaults to the light logo when theme is undefined", () => {
    expect(logoForTheme(undefined)).toBe("/logo-light.png");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/__tests__/theme.test.ts`
Expected: FAIL — cannot find module `@/lib/theme`.

- [ ] **Step 3: Implement the helper**

Create `lib/theme.ts`:
```ts
export function logoForTheme(theme: string | undefined): string {
  return theme === "dark" ? "/logo-dark.png" : "/logo-light.png";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/__tests__/theme.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire ThemeProvider into the layout**

Replace `app/layout.tsx` with:
```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ice Fragrances",
  description: "Premium cold-weather colognes. Free shipping to US & Canada.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Add theme CSS variables**

Append to `app/globals.css`:
```css
:root {
  --bg: #ffffff;
  --fg: #0a0a0a;
  --accent: #34b6f5; /* logo sky blue */
  --card: #f4f8fb;
}
.dark {
  --bg: #060606;
  --fg: #f5f5f5;
  --accent: #34b6f5;
  --card: #111418;
}
body {
  background: var(--bg);
  color: var(--fg);
}
```

- [ ] **Step 7: Run tests + build**

Run: `npm test && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add lib/theme.ts lib/__tests__/theme.test.ts app/layout.tsx app/globals.css
git commit -m "feat: theme provider + logo helper (tested)"
```

---

### Task 8: VideoPlayer component (muted autoplay loop + unmute) — TDD

**Files:**
- Create: `components/VideoPlayer.tsx`
- Test: `components/__tests__/VideoPlayer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/VideoPlayer.test.tsx`:
```tsx
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoPlayer } from "@/components/VideoPlayer";

beforeAll(() => {
  // jsdom has no IntersectionObserver
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  global.IntersectionObserver = IO;
  // jsdom doesn't implement play/pause
  window.HTMLMediaElement.prototype.play = async () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
});

describe("VideoPlayer", () => {
  it("renders a muted, looping video with the poster", () => {
    render(<VideoPlayer src="/media/x.mp4" poster="/media/x.jpg" label="X" />);
    const video = screen.getByTestId("video") as HTMLVideoElement;
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("poster", "/media/x.jpg");
    expect(video.muted).toBe(true);
  });

  it("toggles mute when the unmute button is clicked", async () => {
    render(<VideoPlayer src="/media/x.mp4" poster="/media/x.jpg" label="X" />);
    const video = screen.getByTestId("video") as HTMLVideoElement;
    const button = screen.getByRole("button", { name: /unmute/i });
    await userEvent.click(button);
    expect(video.muted).toBe(false);
    expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/__tests__/VideoPlayer.test.tsx`
Expected: FAIL — cannot find module `@/components/VideoPlayer`.

- [ ] **Step 3: Implement the component**

Create `components/VideoPlayer.tsx`:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = { src: string; poster: string; label: string };

export function VideoPlayer({ src, poster, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Keep the DOM element's muted property in sync (attribute alone is unreliable)
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  // Play only while on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative">
      <video
        ref={ref}
        data-testid="video"
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        className="w-full h-full object-cover rounded-2xl"
      />
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white px-3 py-1 text-sm backdrop-blur"
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/__tests__/VideoPlayer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/VideoPlayer.tsx components/__tests__/VideoPlayer.test.tsx
git commit -m "feat: VideoPlayer with unmute + lazy play (tested)"
```

---

### Task 9: ProductCard (video⇄photo arrow + add to cart) — TDD

**Files:**
- Create: `components/ProductCard.tsx`
- Test: `components/__tests__/ProductCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/__tests__/ProductCard.test.tsx`:
```tsx
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cartStore";
import { PRODUCTS } from "@/lib/products";

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  global.IntersectionObserver = IO;
  window.HTMLMediaElement.prototype.play = async () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
});

beforeEach(() => useCart.getState().clear());

const product = PRODUCTS[0]; // Frost Mind

describe("ProductCard", () => {
  it("shows the video first and flips to the photo on arrow click", async () => {
    render(<ProductCard product={product} />);
    expect(screen.getByTestId("video")).toBeInTheDocument();
    expect(screen.queryByTestId("product-photo")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show photo/i }));
    expect(screen.getByTestId("product-photo")).toBeInTheDocument();
    expect(screen.queryByTestId("video")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show video/i }));
    expect(screen.getByTestId("video")).toBeInTheDocument();
  });

  it("adds the product to the cart", async () => {
    render(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(useCart.getState().items).toEqual([{ id: product.id, qty: 1 }]);
  });

  it("displays the formatted price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("$108.00")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/__tests__/ProductCard.test.tsx`
Expected: FAIL — cannot find module `@/components/ProductCard`.

- [ ] **Step 3: Implement the component**

Create `components/ProductCard.tsx`:
```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useCart } from "@/lib/cartStore";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [showPhoto, setShowPhoto] = useState(false);
  const add = useCart((s) => s.add);
  const price = `$${(product.priceCents / 100).toFixed(2)}`;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--card)" }}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
        {showPhoto ? (
          <Image
            src={product.poster}
            alt={product.name}
            fill
            data-testid="product-photo"
            className="object-cover"
          />
        ) : (
          <VideoPlayer
            src={product.video}
            poster={product.poster}
            label={product.name}
          />
        )}
        <button
          type="button"
          onClick={() => setShowPhoto((v) => !v)}
          aria-label={showPhoto ? "Show video" : "Show photo"}
          className="absolute top-3 right-3 rounded-full bg-black/60 text-white w-9 h-9 grid place-items-center backdrop-blur"
        >
          {showPhoto ? "‹" : "›"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{product.name}</h3>
        <span className="font-semibold">{price}</span>
      </div>
      <p className="text-sm opacity-70">{product.blurb}</p>

      <button
        type="button"
        onClick={() => add(product.id)}
        className="mt-1 rounded-full px-4 py-2 font-medium text-black"
        style={{ background: "var(--accent)" }}
      >
        Add to Cart
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/__tests__/ProductCard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/ProductCard.tsx components/__tests__/ProductCard.test.tsx
git commit -m "feat: ProductCard with video/photo toggle + add to cart (tested)"
```

---

### Task 10: Header, Logo, ThemeToggle, Footer

**Files:**
- Create: `components/Logo.tsx`, `components/ThemeToggle.tsx`, `components/Header.tsx`, `components/Footer.tsx`

- [ ] **Step 1: Logo component**

Create `components/Logo.tsx`:
```tsx
"use client";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { logoForTheme } from "@/lib/theme";

export function Logo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const src = logoForTheme(mounted ? resolvedTheme : "light");
  return (
    <Image src={src} alt="Ice Fragrances" width={180} height={60} priority />
  );
}
```

- [ ] **Step 2: ThemeToggle component**

Create `components/ThemeToggle.tsx`:
```tsx
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border px-3 py-1 text-sm"
    >
      {isDark ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
```

- [ ] **Step 3: Header component (logo sits on frosted glass so the dark-mode icon stays crisp)**

Create `components/Header.tsx`:
```tsx
"use client";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/lib/cartStore";

export function Header({ onCartClick }: { onCartClick: () => void }) {
  const count = useCart((s) => s.count());
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--bg)]/70 border-b border-black/10 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={onCartClick}
            aria-label="Open cart"
            className="rounded-full border px-3 py-1 text-sm"
          >
            Cart ({count})
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Footer component**

Create `components/Footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm opacity-70 flex flex-col sm:flex-row gap-2 justify-between">
        <span>© {new Date().getFullYear()} Ice Fragrances</span>
        <span>Free shipping to US &amp; Canada · hello@icefragrances.com</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/Logo.tsx components/ThemeToggle.tsx components/Header.tsx components/Footer.tsx
git commit -m "feat: header, logo, theme toggle, footer"
```

---

### Task 11: HeroVideo + CartDrawer

**Files:**
- Create: `components/HeroVideo.tsx`, `components/CartDrawer.tsx`

- [ ] **Step 1: HeroVideo component**

Create `components/HeroVideo.tsx`:
```tsx
import { VideoPlayer } from "@/components/VideoPlayer";

export function HeroVideo() {
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="aspect-video w-full overflow-hidden rounded-3xl">
          <VideoPlayer
            src="/media/cloudnine.mp4"
            poster="/media/cloudnine.jpg"
            label="Ice Fragrances"
          />
        </div>
        <div className="text-center mt-8">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Scent, frozen in a moment.
          </h1>
          <a
            href="#products"
            className="inline-block mt-5 rounded-full px-6 py-3 font-medium text-black"
            style={{ background: "var(--accent)" }}
          >
            Shop
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: CartDrawer component**

Create `components/CartDrawer.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { getProduct } from "@/lib/products";

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, remove, totalCents } = useCart();
  const [loading, setLoading] = useState(false);
  const total = `$${(totalCents() / 100).toFixed(2)}`;

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Checkout failed");
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md p-5 shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button type="button" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <p className="opacity-70">Your cart is empty.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((i) => {
              const p = getProduct(i.id);
              if (!p) return null;
              return (
                <li key={i.id} className="flex justify-between items-center">
                  <span>
                    {p.name} × {i.qty}
                  </span>
                  <span className="flex items-center gap-3">
                    ${((p.priceCents * i.qty) / 100).toFixed(2)}
                    <button
                      type="button"
                      onClick={() => remove(i.id)}
                      aria-label={`Remove ${p.name}`}
                      className="opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 border-t pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{total}</span>
        </div>
        <button
          type="button"
          disabled={items.length === 0 || loading}
          onClick={checkout}
          className="mt-4 w-full rounded-full px-4 py-3 font-medium text-black disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Redirecting…" : "Checkout"}
        </button>
        <p className="text-xs opacity-60 mt-2 text-center">
          Free shipping to US &amp; Canada.
        </p>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components/HeroVideo.tsx components/CartDrawer.tsx
git commit -m "feat: hero video + cart drawer with Stripe checkout"
```

---

### Task 12: Assemble the page + success page

**Files:**
- Modify: `app/page.tsx`
- Create: `app/success/page.tsx`
- Create: `components/Products.tsx`

- [ ] **Step 1: Products grid**

Create `components/Products.tsx`:
```tsx
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export function Products() {
  return (
    <section id="products" className="max-w-6xl mx-auto px-4 mt-20">
      <h2 className="text-3xl font-semibold mb-8 text-center">The Collection</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Assemble the page**

Replace `app/page.tsx` with:
```tsx
"use client";
import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroVideo } from "@/components/HeroVideo";
import { Products } from "@/components/Products";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <main>
      <Header onCartClick={() => setCartOpen(true)} />
      <HeroVideo />
      <Products />
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 3: Success page**

Create `app/success/page.tsx`:
```tsx
import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Thank you ❄️</h1>
        <p className="mt-3 opacity-70">
          Your order is confirmed. A receipt is on its way to your email.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-full px-6 py-3 font-medium text-black"
          style={{ background: "var(--accent)" }}
        >
          Back to store
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Full verification**

Run:
```bash
npm test
npm run build
npm run dev
```
Then in a browser at `http://localhost:3000`, manually verify (see Task 13). Note: the cart clears itself after a successful Stripe redirect is out of scope; clear it manually if needed during testing.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/success/page.tsx components/Products.tsx
git commit -m "feat: assemble one-page store + success page"
```

---

### Task 13: Manual QA pass

**Files:** none (verification only)

- [ ] **Step 1: Functional checklist (record pass/fail for each)**

With `npm run dev` running:
- Hero video autoplays, loops, is muted; clicking Unmute plays sound; Mute re-mutes.
- Each product card: video autoplays muted; arrow flips to photo and back; Unmute works per card.
- Add to Cart increments the header cart count.
- Cart drawer opens, shows correct line items + total, remove works.
- Checkout redirects to Stripe (test mode); completing a test payment (card `4242 4242 4242 4242`, any future expiry/CVC) lands on `/success`.
- Theme toggle switches light/dark; logo swaps (black-letter ↔ white-letter); choice persists on reload.
- Mobile width (DevTools ~390px): layout is single-column, videos still autoplay.

- [ ] **Step 2: Dark-mode logo polish decision**

Confirm the dark-mode logo reads clearly on the frosted header. If the icon's black outline still looks weak on dark, add to `Logo.tsx` a subtle drop-shadow in dark mode:
```tsx
className="dark:[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.6))]"
```
(Add to the `Image`.) Re-check, then commit if changed.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: QA polish pass"
```

---

### Task 14: Deploy to Vercel

**Files:** none (deployment)

- [ ] **Step 1: Push to a remote**

Create a GitHub repo and push (`gh repo create ice-fragrances --private --source=. --push`), or connect via the Vercel dashboard.

- [ ] **Step 2: Import to Vercel**

In Vercel, import the repo. Framework auto-detected as Next.js.

- [ ] **Step 3: Set environment variables in Vercel**

- `STRIPE_SECRET_KEY` = your Stripe **live** key (use test key for a preview deploy first)
- `NEXT_PUBLIC_SITE_URL` = `https://icefragrances.com`

- [ ] **Step 4: Attach the domain**

Add `icefragrances.com` (and `www`) in Vercel → Domains; update DNS at your registrar per Vercel's instructions.

- [ ] **Step 5: Verify production**

Visit `https://icefragrances.com`: videos load fast, theme toggle works, and a real (or test-mode) checkout completes and returns to `/success`. Switch Stripe to live keys only when ready to take real orders.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: production deploy config" --allow-empty
```

---

## Notes for the implementer

- **Stripe keys:** never commit `.env.local`. Use test keys (`sk_test_…`) until launch.
- **Video size is the #1 risk.** If the page feels heavy, lower video resolution/bitrate in `scripts/compress-videos.sh` (raise `-crf` to 30–32) and re-run. The hero (CloudNine) is the largest source; trim it to a short loop if needed.
- **Cart persistence:** the Zustand `persist` middleware keeps the cart across reloads via localStorage. After a successful order you may clear it on `/success` if desired (future enhancement).
- **Out of scope (per spec):** accounts, reviews, blog, inventory, international shipping beyond US/CA.
