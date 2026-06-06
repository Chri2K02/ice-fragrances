"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/lib/currency";

type CurrencyState = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
};

export const useCurrency = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "CAD",
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "icefrag-currency" }
  )
);

// Returns "USD" until mounted (avoids hydration mismatch), then the saved value.
export function useDisplayCurrency(): Currency {
  const currency = useCurrency((s) => s.currency);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? currency : "CAD";
}
