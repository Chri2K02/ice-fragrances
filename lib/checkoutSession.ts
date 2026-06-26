import type { CartItem } from "@/lib/cartStore";
import type { Currency } from "@/lib/currency";
import type { CheckoutAddress } from "@/lib/checkoutStore";

type Payload = {
  items: CartItem[];
  address?: CheckoutAddress;
  currency: Currency;
  fbp?: string;
  fbc?: string;
};

// In-flight Checkout Session, started early (when the user clicks Checkout in
// the cart) so the network round-trip overlaps with the route transition.
let inflight: Promise<string> | null = null;

// Kick off session creation now and stash the promise. The /checkout page
// consumes it via takeCheckoutSession() instead of issuing a fresh request,
// so the embedded form can mount as soon as the page renders.
export function prefetchCheckoutSession(payload: Payload): Promise<string> {
  inflight = fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const data = await res.json();
    if (!data.client_secret) throw new Error(data.error ?? "Checkout failed");
    return data.client_secret as string;
  });
  inflight.catch(() => {}); // avoid unhandled-rejection noise if nobody consumes
  return inflight;
}

// Returns the pre-created session promise once, clearing it. Null if none was
// started (e.g. the user navigated to /checkout directly).
export function takeCheckoutSession(): Promise<string> | null {
  const p = inflight;
  inflight = null;
  return p;
}
