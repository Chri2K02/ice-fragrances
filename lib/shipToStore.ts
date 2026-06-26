"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Country } from "@/lib/shipping";
import type { Currency } from "@/lib/currency";

// Where the order ships. `country: null` means the customer hasn't explicitly
// chosen yet, so we follow the browse currency (USD -> US, CAD -> Canada) as a
// sensible default. Once they pick in the cart's "Ship to" selector it sticks,
// independent of the browse toggle — so a Canadian viewing USD can still ship to
// Canada (CAD, no tariff). Ship-to is what drives the charge currency, the US
// import tariff, and which addresses Stripe accepts.
type ShipToState = {
  country: Country | null;
  setCountry: (c: Country) => void;
};

export const useShipToStore = create<ShipToState>()(
  persist(
    (set) => ({
      country: null,
      setCountry: (country) => set({ country }),
    }),
    { name: "icefrag-shipto" }
  )
);

// Resolve the effective ship-to: the explicit choice, else the region implied by
// the current browse currency.
export function effectiveShipTo(
  explicit: Country | null,
  browse: Currency
): Country {
  return explicit ?? (browse === "USD" ? "US" : "CA");
}
