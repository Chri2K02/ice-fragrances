"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Currency } from "@/lib/currency";
import { useMounted } from "@/lib/ui";

type CurrencyState = {
  currency: Currency;
  setCurrency: (c: Currency) => void;
};

// Mirrors the choice onto <html data-currency>, which is what CSS keys on to
// pick between the pre-rendered CAD/USD variants (see globals.css). public/
// boot.js sets it before first paint; this keeps it true afterwards. CAD is the
// default and carries no attribute.
function syncCurrencyAttribute(currency: Currency) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (currency === "USD") el.setAttribute("data-currency", "USD");
  else el.removeAttribute("data-currency");
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "CAD",
      setCurrency: (currency) => {
        syncCurrencyAttribute(currency);
        set({ currency });
      },
    }),
    {
      name: "icefrag-currency",
      // Rehydration can arrive after the store is created; re-assert then, so a
      // stored USD survives even if boot.js was bypassed (e.g. a cached HTML
      // shell served before the script landed).
      onRehydrateStorage: () => (state) => {
        if (state) syncCurrencyAttribute(state.currency);
      },
    }
  )
);

// Returns "CAD" until hydration (avoids hydration mismatch), then the saved
// value — useMounted is the setState-free hydration guard from lib/ui.
//
// PREFER the CSS variant swap (.cur-swap, see globals.css) for anything that
// renders during SSR: this hook is correct only AFTER hydration, so using it
// for server-rendered prices is what caused the CAD→USD flip.
export function useDisplayCurrency(): Currency {
  const currency = useCurrency((s) => s.currency);
  return useMounted() ? currency : "CAD";
}
