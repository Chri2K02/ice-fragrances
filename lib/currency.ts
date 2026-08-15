export type Currency = "USD" | "CAD";

// Base prices in the product config are CAD. This is the fixed CAD -> USD rate
// for showing/charging USD. Update this when the rate drifts.
export const CAD_TO_USD = 0.72;

// Converts a base (CAD) amount in cents to the selected currency.
export function convertCents(baseCadCents: number, currency: Currency): number {
  return currency === "USD"
    ? Math.round(baseCadCents * CAD_TO_USD)
    : baseCadCents;
}

export function formatPrice(baseCadCents: number, currency: Currency): string {
  const cents = convertCents(baseCadCents, currency);
  const symbol = currency === "USD" ? "US$" : "C$";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function stripeCurrency(currency: Currency): "usd" | "cad" {
  return currency === "USD" ? "usd" : "cad";
}

/**
 * Formats an amount ALREADY denominated in `currency` — no conversion. Use for
 * settled amounts (order totals from Stripe), where formatPrice would be wrong
 * because it converts a CAD base price. The US$/C$ prefix is what makes a
 * total unambiguous: the store settles in both.
 */
export function formatMoney(cents: number, currency: string): string {
  const cur = currency?.toUpperCase() === "USD" ? "USD" : "CAD";
  const symbol = cur === "USD" ? "US$" : "C$";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
