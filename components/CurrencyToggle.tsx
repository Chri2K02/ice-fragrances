"use client";
import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/currencyStore";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <button
      type="button"
      aria-label="Toggle currency (USD / CAD)"
      onClick={() => setCurrency(currency === "USD" ? "CAD" : "USD")}
      className="rounded-full border px-2 sm:px-3 py-1 text-sm whitespace-nowrap"
    >
      {currency}
    </button>
  );
}
