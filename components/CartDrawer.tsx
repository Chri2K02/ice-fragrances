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
