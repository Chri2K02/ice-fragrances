import { getProduct } from "@/lib/products";
import type { CartItem } from "@/lib/cartStore";

export type Country = "US" | "CA";

// Province/state -> zone number (ship-from: British Columbia).
const CA_ZONE: Record<string, number> = {
  BC: 1,
  AB: 2, SK: 2, MB: 2, YT: 2, NT: 2, NU: 2,
  ON: 3, QC: 3, NB: 3, NS: 3, PE: 3, NL: 3,
};
const US_WEST = ["WA", "OR", "CA", "NV", "ID", "MT", "AZ", "UT", "WY", "CO", "AK", "HI"];

// Zone -> price in cents.
const ZONE_CENTS: Record<number, number> = {
  1: 1500, // Local (BC)
  2: 1200, // Western Canada
  3: 1500, // Eastern Canada
  4: 1625, // Western US
  5: 1600, // Rest of US
};

export function zoneFor(country: Country, region: string): number {
  const r = (region || "").toUpperCase();
  if (country === "CA") return CA_ZONE[r] ?? 3; // default: rest of Canada
  return US_WEST.includes(r) ? 4 : 5; // US
}

export function shippingRateCents(country: Country, region: string): number {
  return ZONE_CENTS[zoneFor(country, region)];
}

// True when the cart has any item that is NOT free-shipping (apparel/accessory).
// Those carts need the address step to compute a zone rate; all-cologne carts don't.
export function cartNeedsShipping(items: CartItem[]): boolean {
  return items.some((i) => !getProduct(i.id)?.freeShipping);
}

// All-cologne carts ship free; any apparel/accessory triggers the zone rate.
export function orderShippingCents(
  items: CartItem[],
  country: Country,
  region: string
): number {
  return cartNeedsShipping(items) ? shippingRateCents(country, region) : 0;
}

export const CA_PROVINCES: [string, string][] = [
  ["AB", "Alberta"],
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"],
  ["NT", "Northwest Territories"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
];

export const US_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

export function regionsFor(country: Country): [string, string][] {
  return country === "CA" ? CA_PROVINCES : US_STATES;
}
