"use client";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Country } from "@/lib/shipping";

// Where the order ships — independent of the header browse-currency toggle. This
// is what actually drives the charge currency, the US import tariff, and which
// addresses Stripe accepts. Kept separate so a Canadian browsing USD prices can
// still ship to Canada (CAD, no tariff), and vice versa.
type ShipToState = {
  country: Country;
  setCountry: (c: Country) => void;
};

export const useShipToStore = create<ShipToState>()(
  persist(
    (set) => ({
      country: "CA",
      setCountry: (country) => set({ country }),
    }),
    { name: "icefrag-shipto" }
  )
);

// Defaults to "CA" until mounted (avoids hydration mismatch), then the saved value.
export function useShipTo(): Country {
  const country = useShipToStore((s) => s.country);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? country : "CA";
}
