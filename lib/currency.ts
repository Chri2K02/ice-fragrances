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
  const symbol = currency === "USD" ? "US$" : "$";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function stripeCurrency(currency: Currency): "usd" | "cad" {
  return currency === "USD" ? "usd" : "cad";
}
