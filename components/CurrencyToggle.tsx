"use client";
import { useCurrency } from "@/lib/currencyStore";
import { PILL_BUTTON } from "@/lib/ui";

// Renders on the server with BOTH labels, CSS revealing the active one (see
// .cur-swap in globals.css, driven by public/boot.js before first paint).
// Previously this returned null until mounted, so the pill popped into the
// header a beat late and shifted the controls beside it.
export function CurrencyToggle() {
  const currency = useCurrency((s) => s.currency);
  const setCurrency = useCurrency((s) => s.setCurrency);
  return (
    <button
      type="button"
      aria-label="Toggle currency (USD / CAD)"
      onClick={() => setCurrency(currency === "USD" ? "CAD" : "USD")}
      className={`${PILL_BUTTON} cur-swap`}
    >
      <span data-cur="CAD">CAD</span>
      <span data-cur="USD">USD</span>
    </button>
  );
}
