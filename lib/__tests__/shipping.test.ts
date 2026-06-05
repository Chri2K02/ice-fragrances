import { describe, it, expect } from "vitest";
import { zoneFor, shippingRateCents, orderShippingCents } from "@/lib/shipping";

describe("zones", () => {
  it("maps Canadian provinces to zones", () => {
    expect(zoneFor("CA", "BC")).toBe(1);
    expect(zoneFor("CA", "AB")).toBe(2);
    expect(zoneFor("CA", "ON")).toBe(3);
    expect(zoneFor("CA", "ZZ")).toBe(3); // unknown -> rest of Canada
  });
  it("maps US states to zones", () => {
    expect(zoneFor("US", "CA")).toBe(4);
    expect(zoneFor("US", "wa")).toBe(4); // case-insensitive
    expect(zoneFor("US", "TX")).toBe(5);
    expect(zoneFor("US", "NY")).toBe(5);
  });
});

describe("shippingRateCents", () => {
  it("returns the configured zone prices", () => {
    expect(shippingRateCents("CA", "BC")).toBe(1500);
    expect(shippingRateCents("CA", "AB")).toBe(1200);
    expect(shippingRateCents("CA", "ON")).toBe(1500);
    expect(shippingRateCents("US", "CA")).toBe(1625);
    expect(shippingRateCents("US", "TX")).toBe(1600);
  });
});

describe("orderShippingCents", () => {
  it("is free when the cart is all colognes", () => {
    const items = [
      { id: "frost-mind", qty: 1 },
      { id: "glacier-hours", qty: 2 },
    ];
    expect(orderShippingCents(items, "US", "TX")).toBe(0);
  });

  it("is free when the cart contains a cologne, even alongside an accessory", () => {
    const items = [
      { id: "frost-mind", qty: 1 },
      { id: "humidifier", qty: 1 },
    ];
    expect(orderShippingCents(items, "CA", "AB")).toBe(0);
  });

  it("charges the zone rate for an accessory-only cart", () => {
    expect(orderShippingCents([{ id: "tshirt", qty: 1 }], "US", "CA")).toBe(1625);
  });
});
