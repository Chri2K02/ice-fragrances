"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cartStore";
import { getProduct } from "@/lib/products";
import { regionsFor, cartNeedsShipping, type Country } from "@/lib/shipping";
import { formatPrice, convertCents, type Currency } from "@/lib/currency";
import { US_TARIFF_CENTS } from "@/lib/checkout";
import { useDisplayCurrency } from "@/lib/currencyStore";
import { useShipToStore, effectiveShipTo } from "@/lib/shipToStore";
import { useCheckoutDraft } from "@/lib/checkoutStore";
import { prefetchCheckoutSession } from "@/lib/checkoutSession";
import { fbTrack } from "@/lib/fbpixel";

const EMPTY = { name: "", country: "CA" as Country, state: "", line1: "", city: "", postal: "" };

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, add, decrement, remove, totalCents } = useCart();
  const [step, setStep] = useState<"cart" | "address">("cart");
  const [addr, setAddr] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ship-to country drives the CHARGE currency + US tariff, independent of the
  // header browse-currency toggle — but it DEFAULTS to the browse region so what
  // you see is what you get (USD -> US), while a Canadian viewing USD can still
  // switch to Canada. The cart total below reflects the real charge currency.
  const browse = useDisplayCurrency();
  const explicitShipTo = useShipToStore((s) => s.country);
  const shipTo = effectiveShipTo(explicitShipTo, browse);
  const setShipTo = useShipToStore((s) => s.setCountry);
  const currency: Currency = shipTo === "US" ? "USD" : "CAD";
  const total = formatPrice(totalCents(), currency);
  const needsAddress = cartNeedsShipping(items);
  const router = useRouter();
  const setDraftAddress = useCheckoutDraft((s) => s.setAddress);

  // Keep the apparel address country aligned with the ship-to choice.
  useEffect(() => {
    setAddr((a) => (a.country === shipTo ? a : { ...a, country: shipTo, state: "" }));
  }, [shipTo]);

  // The drawer lives in the persistent layout, so it does NOT unmount when we
  // navigate to /checkout. Clear the stale "loading" flag (and prefetch the
  // checkout route) every time the cart reopens — otherwise the button stays
  // stuck on "Loading…" after a checkout -> back -> reopen.
  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
      router.prefetch("/checkout");
      // Warm Stripe.js (code-split, so it stays out of the main bundle) so the
      // embedded form renders sooner once we reach /checkout.
      const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (key) {
        import("@stripe/stripe-js")
          .then((m) => m.loadStripe(key))
          .catch(() => {});
      }
    }
  }, [open, router]);

  const canSubmit =
    addr.name && addr.state && addr.line1 && addr.city && addr.postal;

  // Hand off to the embedded /checkout page instead of redirecting to Stripe.
  // Apparel/accessories carry the collected address (used for the shipping zone);
  // colognes ship free and let Stripe collect the address, so we clear any draft.
  function goToCheckout() {
    setLoading(true);
    setError(null);
    const address = needsAddress ? { ...addr, country: shipTo } : undefined;
    fbTrack("InitiateCheckout", {
      value: convertCents(totalCents(), currency) / 100,
      currency,
      num_items: items.reduce((n, i) => n + i.qty, 0),
    });
    // Capture Meta browser cookies so the server-side Purchase can match the user.
    const fbp = document.cookie.match(/(?:^|; )_fbp=([^;]+)/)?.[1];
    const fbc = document.cookie.match(/(?:^|; )_fbc=([^;]+)/)?.[1];
    // Start the Stripe session NOW so it runs in parallel with the navigation —
    // /checkout consumes the result instead of waiting on a fresh request. The
    // ship-to country is what the server uses to set currency + the US tariff.
    prefetchCheckoutSession({ items, address, country: shipTo, fbp, fbc });
    setDraftAddress(address ?? null);
    onClose();
    router.push("/checkout");
  }

  const field =
    "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm";
  // Native <select> needs a solid bg + explicit text color, or the option list
  // renders white-on-white in dark mode (options inherit the page colors).
  const selectField =
    "w-full rounded-lg border border-black/15 dark:border-white/20 bg-white text-black dark:bg-neutral-900 dark:text-white px-3 py-2 text-sm";

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md p-5 shadow-xl overflow-y-auto transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--bg)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {step === "cart" ? "Your Cart" : "Shipping address"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>

        {step === "cart" && (
          <>
            {items.length === 0 ? (
              <p className="opacity-70">Your cart is empty.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((i) => {
                  const p = getProduct(i.id);
                  if (!p) return null;
                  return (
                    <li
                      key={i.id + (i.size ?? "")}
                      className="flex items-center gap-3"
                    >
                      <span className="truncate min-w-0 flex-1">
                        {p.name}
                        {i.size ? ` (${i.size})` : ""}
                      </span>
                      <div className="inline-flex items-center rounded-full border border-black/20 dark:border-white/25 shrink-0">
                        <button
                          type="button"
                          onClick={() => decrement(i.id, i.size)}
                          aria-label={`Decrease ${p.name} quantity`}
                          className="w-7 h-7 grid place-items-center text-base hover:opacity-70"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm">{i.qty}</span>
                        <button
                          type="button"
                          onClick={() => add(i.id, i.size)}
                          aria-label={`Increase ${p.name} quantity`}
                          className="w-7 h-7 grid place-items-center text-base hover:opacity-70"
                        >
                          +
                        </button>
                      </div>
                      <span className="flex items-center gap-2 shrink-0">
                        {formatPrice(p.priceCents * i.qty, currency)}
                        <button
                          type="button"
                          onClick={() => remove(i.id, i.size)}
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

            {items.length > 0 && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <span className="text-sm opacity-80">Ship to</span>
                <select
                  className="rounded-lg border border-black/15 dark:border-white/20 bg-white text-black dark:bg-neutral-900 dark:text-white px-3 py-2 text-sm"
                  value={shipTo}
                  onChange={(e) => setShipTo(e.target.value as Country)}
                  aria-label="Shipping destination"
                >
                  <option value="CA">🇨🇦 Canada (CAD)</option>
                  <option value="US">🇺🇸 United States (USD)</option>
                </select>
              </div>
            )}

            <div className="mt-4 border-t pt-4 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{total}</span>
            </div>
            {currency === "USD" && items.length > 0 && (
              <div className="mt-2 flex justify-between text-sm opacity-80">
                <span>US import tariff</span>
                <span>US${(US_TARIFF_CENTS / 100).toFixed(2)}</span>
              </div>
            )}
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <button
              type="button"
              disabled={items.length === 0 || loading}
              onClick={() => (needsAddress ? setStep("address") : goToCheckout())}
              className="mt-4 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Loading…" : "Checkout"}
            </button>
            <p className="text-xs opacity-60 mt-2 text-center">
              {needsAddress
                ? "Shipping & taxes calculated at the next step."
                : "Colognes ship free. Taxes calculated at checkout."}
            </p>
          </>
        )}

        {step === "address" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm opacity-70">
              Shipping to {addr.country === "CA" ? "🇨🇦 Canada" : "🇺🇸 United States"}{" "}
              (change in cart). Enter your address to calculate shipping &amp; taxes.
            </p>
            <input
              className={field}
              placeholder="Full name"
              value={addr.name}
              onChange={(e) => setAddr({ ...addr, name: e.target.value })}
            />
            <input
              className={field}
              placeholder="Street address"
              value={addr.line1}
              onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
            />
            <input
              className={field}
              placeholder="City"
              value={addr.city}
              onChange={(e) => setAddr({ ...addr, city: e.target.value })}
            />
            <select
              className={selectField}
              value={addr.state}
              onChange={(e) => setAddr({ ...addr, state: e.target.value })}
            >
              <option value="">
                {addr.country === "CA" ? "Province" : "State"}
              </option>
              {regionsFor(addr.country).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <input
              className={field}
              placeholder={addr.country === "CA" ? "Postal code" : "ZIP code"}
              value={addr.postal}
              onChange={(e) => setAddr({ ...addr, postal: e.target.value })}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="button"
              disabled={!canSubmit || loading}
              onClick={goToCheckout}
              className="mt-1 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Loading…" : "Continue to payment"}
            </button>
            <button
              type="button"
              onClick={() => setStep("cart")}
              className="text-sm opacity-60 hover:opacity-100"
            >
              ‹ Back to cart
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
