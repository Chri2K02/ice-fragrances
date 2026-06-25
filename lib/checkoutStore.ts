import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Country } from "@/lib/shipping";

// The shipping address the cart drawer collects for apparel/accessory orders,
// handed off to the /checkout page so it can create the Stripe session with the
// right zone rate. Colognes ship free and let Stripe collect the address, so
// they leave this null. Persisted to sessionStorage: survives the navigation to
// /checkout and a refresh there, but clears when the tab closes.
export type CheckoutAddress = {
  name: string;
  country: Country;
  state: string;
  line1: string;
  city: string;
  postal: string;
};

type CheckoutDraft = {
  address: CheckoutAddress | null;
  setAddress: (address: CheckoutAddress | null) => void;
};

export const useCheckoutDraft = create<CheckoutDraft>()(
  persist(
    (set) => ({
      address: null,
      setAddress: (address) => set({ address }),
    }),
    {
      name: "icefrag-checkout-draft",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.sessionStorage : (undefined as never)
      ),
    }
  )
);
