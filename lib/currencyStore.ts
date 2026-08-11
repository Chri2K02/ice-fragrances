"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/lib/currency";
import { useMounted } from "@/lib/ui";

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

// Returns "CAD" until hydration (avoids hydration mismatch), then the saved
// value — useMounted is the setState-free hydration guard from lib/ui.
export function useDisplayCurrency(): Currency {
  const currency = useCurrency((s) => s.currency);
  return useMounted() ? currency : "CAD";
}
