"use client";
import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { getProduct } from "@/lib/products";
import { regionsFor, cartNeedsShipping, type Country } from "@/lib/shipping";
import { formatPrice, convertCents } from "@/lib/currency";
import { useDisplayCurrency } from "@/lib/currencyStore";
import { fbTrack } from "@/lib/fbpixel";

const EMPTY = { name: "", country: "CA" as Country, state: "", line1: "", city: "", postal: "" };

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, remove, totalCents } = useCart();
  const [step, setStep] = useState<"cart" | "address">("cart");
  const [addr, setAddr] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = useDisplayCurrency();
  const total = formatPrice(totalCents(), currency);
  const needsAddress = cartNeedsShipping(items);

  const canSubmit =
    addr.name && addr.state && addr.line1 && addr.city && addr.postal;

  async function payNow() {
    setLoading(true);
    setError(null);
    fbTrack("InitiateCheckout", {
      value: convertCents(totalCents(), currency) / 100,
      currency,
      num_items: items.reduce((n, i) => n + i.qty, 0),
    });
    // Capture Meta browser cookies so the server-side Purchase can match the user.
    const fbp = document.cookie.match(/(?:^|; )_fbp=([^;]+)/)?.[1];
    const fbc = document.cookie.match(/(?:^|; )_fbc=([^;]+)/)?.[1];
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, address: addr, currency, fbp, fbc }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Checkout failed");
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm";

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
                      className="flex justify-between items-center"
                    >
                      <span>
                        {p.name}
                        {i.size ? ` (${i.size})` : ""} × {i.qty}
                      </span>
                      <span className="flex items-center gap-3">
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

            <div className="mt-6 border-t pt-4 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{total}</span>
            </div>
            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
            <button
              type="button"
              disabled={items.length === 0 || loading}
              onClick={() => (needsAddress ? setStep("address") : payNow())}
              className="mt-4 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Redirecting…" : "Checkout"}
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
              Enter your shipping address to calculate shipping &amp; taxes.
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
            <div className="flex gap-3">
              <select
                className={field}
                value={addr.country}
                onChange={(e) =>
                  setAddr({ ...addr, country: e.target.value as Country, state: "" })
                }
              >
                <option value="CA">Canada</option>
                <option value="US">United States</option>
              </select>
              <select
                className={field}
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
            </div>
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
              onClick={payNow}
              className="mt-1 w-full rounded-full px-4 py-3 font-medium text-black border-2 border-black disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Redirecting…" : "Continue to payment"}
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
