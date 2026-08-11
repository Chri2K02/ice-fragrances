"use client";
import { useCurrency } from "@/lib/currencyStore";
import { PILL_BUTTON, useMounted } from "@/lib/ui";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const mounted = useMounted();
  if (!mounted) return null;
  return (
    <button
      type="button"
      aria-label="Toggle currency (USD / CAD)"
      onClick={() => setCurrency(currency === "USD" ? "CAD" : "USD")}
      className={PILL_BUTTON}
    >
      {currency}
    </button>
  );
}
