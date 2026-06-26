"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cartStore";
import { useCheckoutDraft } from "@/lib/checkoutStore";
import { useDisplayCurrency } from "@/lib/currencyStore";
import { getProduct } from "@/lib/products";
import { cartNeedsShipping } from "@/lib/shipping";
import { formatPrice, convertCents } from "@/lib/currency";
import { US_TARIFF_CENTS } from "@/lib/checkout";
import { fbTrack } from "@/lib/fbpixel";

// Created once, outside the component, so the Stripe object isn't rebuilt on
// every render. The publishable key is public by design (shipped to the browser).
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutPage() {
  const { items } = useCart();
  const address = useCheckoutDraft((s) => s.address);
  const currency = useDisplayCurrency();

  // Persisted cart/currency only exist after client hydration; wait for it so we
  // don't create a session from an empty server-rendered cart or mismatch HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initiated = useRef(false);

  const fetchClientSecret = useCallback(async () => {
    // Fire InitiateCheckout once, mirroring the old cart-drawer behaviour.
    if (!initiated.current) {
      initiated.current = true;
      fbTrack("InitiateCheckout", {
        value: convertCents(
          items.reduce((sum, i) => {
            const p = getProduct(i.id);
            return sum + (p ? p.priceCents * i.qty : 0);
          }, 0),
          currency
        ) / 100,
        currency,
        num_items: items.reduce((n, i) => n + i.qty, 0),
      });
    }
    // Meta browser cookies so the server-side Purchase event can match the user.
    const fbp = document.cookie.match(/(?:^|; )_fbp=([^;]+)/)?.[1];
    const fbc = document.cookie.match(/(?:^|; )_fbc=([^;]+)/)?.[1];

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        address: address ?? undefined,
        currency,
        fbp,
        fbc,
      }),
    });
    const data = await res.json();
    if (!data.client_secret) {
      throw new Error(data.error ?? "Checkout failed");
    }
    return data.client_secret as string;
  }, [items, address, currency]);

  const subtotal = items.reduce((sum, i) => {
    const p = getProduct(i.id);
    return sum + (p ? p.priceCents * i.qty : 0);
  }, 0);

  const needsAddress = cartNeedsShipping(items);
  const missingAddress = needsAddress && !address;

  if (!mounted) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <p className="opacity-60">Loading checkout…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
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

  if (missingAddress) {
    // Reached /checkout without the apparel shipping address (e.g. direct link).
    return (
      <main className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">We need your shipping address</h1>
          <p className="mt-3 opacity-70">
            Please start checkout from your cart so we can calculate shipping.
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-8">Checkout</h1>
      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Order summary */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Order summary</h2>
          <ul className="flex flex-col gap-3">
            {items.map((i) => {
              const p = getProduct(i.id);
              if (!p) return null;
              return (
                <li
                  key={i.id + (i.size ?? "")}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="truncate min-w-0">
                    {p.name}
                    {i.size ? ` (${i.size})` : ""} × {i.qty}
                  </span>
                  <span className="shrink-0">
                    {formatPrice(p.priceCents * i.qty, currency)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 border-t pt-4 flex justify-between font-semibold">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          {currency === "USD" && (
            <div className="mt-2 flex justify-between text-sm opacity-80">
              <span>US import tariff</span>
              <span>US${(US_TARIFF_CENTS / 100).toFixed(2)}</span>
            </div>
          )}
          <p className="text-xs opacity-60 mt-3">
            {needsAddress
              ? "Shipping & taxes calculated below."
              : "Colognes ship free. Taxes calculated below."}
          </p>
          <Link
            href="/"
            className="inline-block text-sm opacity-60 hover:opacity-100 mt-6"
          >
            ‹ Continue shopping
          </Link>
        </section>

        {/* Embedded Stripe payment form. Stripe's prebuilt form renders light and
            can't follow our dark mode, so we frame it: a black border with the
            white form clipped flush inside (overflow-hidden + rounded). Reads as a
            deliberate, tidy payment card on the dark page and stays clean in light
            mode too — only the form area is white. */}
        <section>
          {stripePromise ? (
            <div className="overflow-hidden rounded-2xl border border-[#34b6f5] bg-white shadow-2xl shadow-[#34b6f5]/20">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <p className="text-sm text-red-500">
              Payments are temporarily unavailable. Please try again shortly.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
