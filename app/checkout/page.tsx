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
import { takeCheckoutSession } from "@/lib/checkoutSession";
import { useShipTo } from "@/lib/shipToStore";
import { getProduct } from "@/lib/products";
import { cartNeedsShipping } from "@/lib/shipping";
import { formatPrice, convertCents, type Currency } from "@/lib/currency";
import { US_TARIFF_CENTS } from "@/lib/checkout";
import { fbTrack } from "@/lib/fbpixel";

// Created once, outside the component, so the Stripe object isn't rebuilt on
// every render. The publishable key is public by design (shipped to the browser).
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Reused frame so the spinner, error, and the live form all look identical and
// swap in place without a layout jump. min-height reserves the form's space.
const CARD =
  "overflow-hidden rounded-2xl border border-[#34b6f5] bg-white text-black shadow-2xl shadow-[#34b6f5]/20 min-h-[460px]";

export default function CheckoutPage() {
  const { items } = useCart();
  const address = useCheckoutDraft((s) => s.address);
  // Charge currency follows the ship-to country (matches what Stripe charges),
  // not the header browse-currency toggle.
  const shipTo = useShipTo();
  const currency: Currency = shipTo === "US" ? "USD" : "CAD";

  // Persisted cart/currency only exist after client hydration; wait for it so we
  // don't create a session from an empty server-rendered cart or mismatch HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formReady, setFormReady] = useState(false);
  const requested = useRef(false);
  const initiated = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const needsAddress = cartNeedsShipping(items);
  const missingAddress = needsAddress && !address;

  // Create the Checkout Session up front so we can show a spinner while it loads
  // (instead of a blank card) and surface a real error if it fails.
  const startCheckout = useCallback(async () => {
    setError(null);
    setClientSecret(null);
    setFormReady(false);
    if (!initiated.current) {
      initiated.current = true;
      fbTrack("InitiateCheckout", {
        value:
          convertCents(
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
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          address: address ?? undefined,
          // Apparel address carries its own country; colognes use the ship-to.
          country: address?.country ?? shipTo,
          fbp,
          fbc,
        }),
      });
      const data = await res.json();
      if (data.client_secret) setClientSecret(data.client_secret as string);
      else setError(data.error ?? "Checkout failed. Please try again.");
    } catch {
      setError("Couldn't reach checkout — check your connection and try again.");
    }
  }, [items, address, currency]);

  // Prefer the session the cart drawer already started (overlapped with the
  // navigation) so the form is ready immediately; fall back to creating one here
  // if the user landed on /checkout directly.
  useEffect(() => {
    if (!mounted || requested.current) return;
    if (items.length === 0 || missingAddress) return;
    requested.current = true;
    const pending = takeCheckoutSession();
    if (pending) {
      pending
        .then((cs) => setClientSecret(cs))
        .catch((e: unknown) =>
          setError(
            e instanceof Error ? e.message : "Checkout failed. Please try again."
          )
        );
    } else {
      startCheckout();
    }
  }, [mounted, items.length, missingAddress, startCheckout]);

  const fetchClientSecret = useCallback(
    () => Promise.resolve(clientSecret as string),
    [clientSecret]
  );

  // Keep the spinner up until Stripe's iframe actually loads, not just until we
  // have the session — otherwise the card flashes blank white while the iframe
  // boots. Watch for the iframe Stripe injects and reveal on its load event,
  // with a safety timeout so the spinner can never get stuck.
  useEffect(() => {
    if (!clientSecret) return;
    const host = cardRef.current;
    if (!host) return;
    let done = false;
    const reveal = () => {
      if (!done) {
        done = true;
        setFormReady(true);
      }
    };
    const watch = (iframe: HTMLIFrameElement) =>
      iframe.addEventListener("load", reveal, { once: true });
    const existing = host.querySelector("iframe");
    if (existing) watch(existing);
    const obs = new MutationObserver(() => {
      const iframe = host.querySelector("iframe");
      if (iframe) watch(iframe);
    });
    obs.observe(host, { childList: true, subtree: true });
    const safety = setTimeout(reveal, 5000);
    return () => {
      obs.disconnect();
      clearTimeout(safety);
    };
  }, [clientSecret]);

  const subtotal = items.reduce((sum, i) => {
    const p = getProduct(i.id);
    return sum + (p ? p.priceCents * i.qty : 0);
  }, 0);

  function retry() {
    requested.current = true;
    startCheckout();
  }

  if (!mounted) {
    return (
      <main className="min-h-screen grid place-items-center px-4">
        <Spinner label="Loading checkout…" />
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
      {/* Warm up the connection to Stripe so the form's assets load sooner. */}
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://api.stripe.com" />
      <link rel="preconnect" href="https://m.stripe.network" />

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

        {/* Embedded Stripe payment form, framed in a white card (Stripe renders
            light and can't follow our dark mode). Spinner -> form swaps in place. */}
        <section>
          <div className={CARD} ref={cardRef}>
            {!stripePromise || error ? (
              <div className="p-8 grid place-items-center min-h-[460px] text-center">
                <div>
                  <p className="text-sm text-red-600">
                    {!stripePromise
                      ? "Payments are temporarily unavailable. Please try again shortly."
                      : error}
                  </p>
                  {stripePromise && (
                    <button
                      type="button"
                      onClick={retry}
                      className="mt-4 rounded-full px-5 py-2 text-sm font-medium text-black"
                      style={{ background: "var(--accent)" }}
                    >
                      Try again
                    </button>
                  )}
                  <div className="mt-3">
                    <Link href="/" className="text-sm text-black/60 hover:text-black">
                      ‹ Back to cart
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative min-h-[460px]">
                {clientSecret && (
                  <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ fetchClientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                )}
                {!formReady && (
                  <div className="absolute inset-0 bg-white grid place-items-center p-10">
                    <Spinner label="Loading secure checkout…" dark />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Spinner({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 ${
        dark ? "text-black/60" : "opacity-60"
      }`}
    >
      <div className="h-8 w-8 rounded-full border-2 border-[#34b6f5] border-t-transparent animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
