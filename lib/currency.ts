export type Currency = "USD" | "CAD";

// Fixed USD -> CAD rate. Update this when the rate drifts.
export const USD_TO_CAD = 1.38;

export function convertCents(usdCents: number, currency: Currency): number {
  return currency === "CAD" ? Math.round(usdCents * USD_TO_CAD) : usdCents;
}

export function formatPrice(usdCents: number, currency: Currency): string {
  const cents = convertCents(usdCents, currency);
  const symbol = currency === "CAD" ? "CA$" : "$";
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function stripeCurrency(currency: Currency): "usd" | "cad" {
  return currency === "CAD" ? "cad" : "usd";
}
