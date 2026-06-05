import { describe, it, expect } from "vitest";
import { buildLineItems } from "@/lib/checkout";

describe("buildLineItems", () => {
  it("builds Stripe line items from valid cart items", () => {
    const items = buildLineItems([{ id: "frost-mind", qty: 2 }]);
    expect(items).toEqual([
      {
        quantity: 2,
        price_data: {
          currency: "usd",
          unit_amount: 10800,
          tax_behavior: "exclusive",
          product_data: { name: "Frost", tax_code: "txcd_99999999" },
        },
      },
    ]);
  });

  it("throws on an unknown product id (anti-tamper)", () => {
    expect(() => buildLineItems([{ id: "free-stuff", qty: 1 }])).toThrow();
  });

  it("throws on a non-positive quantity", () => {
    expect(() => buildLineItems([{ id: "frost-mind", qty: 0 }])).toThrow();
  });

  it("throws on an empty cart", () => {
    expect(() => buildLineItems([])).toThrow();
  });
});
