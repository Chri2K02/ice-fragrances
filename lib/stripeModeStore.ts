"use client";
import { create } from "zustand";
import { clearCheckoutSession } from "@/lib/checkoutSession";

// Shared client state for admin-only Stripe test mode, so the badge and the
// header's More menu can't disagree about which mode is active. The SERVER is
// still the authority (lib/stripeMode re-verifies on every request that
// touches a key); this only mirrors what it reported.
type StripeModeState = {
  mode: "test" | "live";
  /** False until the first read lands, so callers can avoid flashing "live". */
  loaded: boolean;
  /** Read the current mode (cookie-backed, admin-verified). */
  refresh: () => Promise<void>;
  /** Apply a mode; returns the mode the server actually granted. */
  apply: (mode: "test" | "live") => Promise<{ mode: "test" | "live"; reason?: string }>;
};

export const useStripeMode = create<StripeModeState>((set) => ({
  mode: "live",
  loaded: false,
  refresh: async () => {
    const res = await fetch("/api/stripe-mode").catch(() => null);
    const data = await res?.json().catch(() => null);
    set({ mode: data?.mode === "test" ? "test" : "live", loaded: true });
  },
  apply: async (mode) => {
    const res = await fetch("/api/stripe-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    const granted = data?.mode === "test" ? "test" : "live";
    // A Checkout Session created before the switch belongs to the OLD mode and
    // would still be consumed by /checkout (module state survives client-side
    // navigation), so discard it on every mode change.
    clearCheckoutSession();
    set({ mode: granted, loaded: true });
    return { mode: granted, reason: data?.reason };
  },
}));
