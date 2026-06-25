import { describe, it, expect } from "vitest";
import { PRODUCTS, getProduct, productsByCategory, CATEGORY_ORDER } from "@/lib/products";

// data/products.json is imported with a type cast, so these checks are what
// actually guarantee the catalog matches the Product contract. A malformed edit
// to the JSON fails here instead of at runtime in checkout or a product page.
describe("catalog data (data/products.json)", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(PRODUCTS)).toBe(true);
    expect(PRODUCTS.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every product satisfies the Product contract", () => {
    for (const p of PRODUCTS) {
      expect(typeof p.id, p.id).toBe("string");
      expect(p.id.length, p.id).toBeGreaterThan(0);
      expect(typeof p.name, p.id).toBe("string");
      expect(p.name.length, p.id).toBeGreaterThan(0);

      // priceCents must be a positive integer — checkout re-derives the charge
      // from this, so a bad value is a money bug.
      expect(Number.isInteger(p.priceCents), p.id).toBe(true);
      expect(p.priceCents, p.id).toBeGreaterThan(0);

      expect(CATEGORY_ORDER, p.id).toContain(p.category);

      expect(typeof p.poster, p.id).toBe("string");
      expect(p.poster.length, p.id).toBeGreaterThan(0);

      // Optional fields, when present, must be well-formed.
      if (p.video !== undefined) expect(typeof p.video, p.id).toBe("string");
      if (p.tagline !== undefined) expect(typeof p.tagline, p.id).toBe("string");
      if (p.notes !== undefined) expect(typeof p.notes, p.id).toBe("string");
      if (p.description !== undefined)
        expect(typeof p.description, p.id).toBe("string");
      if (p.oil !== undefined) expect(typeof p.oil, p.id).toBe("string");
      if (p.freeShipping !== undefined)
        expect(typeof p.freeShipping, p.id).toBe("boolean");

      if (p.images !== undefined) {
        expect(Array.isArray(p.images), p.id).toBe(true);
        expect(p.images.length, p.id).toBeGreaterThan(0);
        for (const src of p.images) expect(typeof src, p.id).toBe("string");
      }

      if (p.sizes !== undefined) {
        expect(Array.isArray(p.sizes), p.id).toBe(true);
        expect(p.sizes.length, p.id).toBeGreaterThan(0);
        for (const s of p.sizes) expect(typeof s, p.id).toBe("string");
      }
    }
  });

  it("getProduct resolves by id and is undefined for unknown ids", () => {
    expect(getProduct(PRODUCTS[0].id)).toBe(PRODUCTS[0]);
    expect(getProduct("does-not-exist")).toBeUndefined();
  });

  it("partitions cleanly into the storefront sections (no orphans)", () => {
    const grouped = CATEGORY_ORDER.flatMap((c) => productsByCategory(c));
    expect(grouped.length).toBe(PRODUCTS.length);
  });
});
