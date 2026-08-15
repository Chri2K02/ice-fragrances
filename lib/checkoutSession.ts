import type { CartItem } from "@/lib/cartStore";
import type { Country } from "@/lib/shipping";
import type { CheckoutAddress } from "@/lib/checkoutStore";

type Payload = {
  items: CartItem[];
  // Cologne carts send the chosen ship-to country; apparel carts send the full
  // address (its country is authoritative). The server derives currency + the
  // US tariff from this, so the client currency toggle can't be used to dodge it.
  address?: CheckoutAddress;
  country?: Country;
  fbp?: string;
  fbc?: string;
};

// The server decides live vs admin test mode and reports it back; the client
// secret is only valid against that mode's publishable key, so the two always
// travel together.
export type CheckoutSession = { clientSecret: string; mode: "test" | "live" };

// In-flight Checkout Session, started early (when the user clicks Checkout in
// the cart) so the network round-trip overlaps with the route transition.
let inflight: Promise<CheckoutSession> | null = null;

// Kick off session creation now and stash the promise. The /checkout page
// consumes it via takeCheckoutSession() instead of issuing a fresh request,
// so the embedded form can mount as soon as the page renders.
export function prefetchCheckoutSession(
  payload: Payload
): Promise<CheckoutSession> {
  inflight = fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const data = await res.json();
    if (!data.client_secret) throw new Error(data.error ?? "Checkout failed");
    return {
      clientSecret: data.client_secret as string,
      mode: data.mode === "test" ? "test" : "live",
    };
  });
  inflight.catch(() => {}); // avoid unhandled-rejection noise if nobody consumes
  return inflight;
}

// Returns the pre-created session promise once, clearing it. Null if none was
// started (e.g. the user navigated to /checkout directly).
export function takeCheckoutSession(): Promise<CheckoutSession> | null {
  const p = inflight;
  inflight = null;
  return p;
}
