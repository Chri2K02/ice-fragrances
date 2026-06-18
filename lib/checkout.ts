import { getProduct } from "@/lib/products";
import type { CartItem } from "@/lib/cartStore";
import { type Currency, convertCents, stripeCurrency } from "@/lib/currency";

export type StripeLineItem = {
  quantity: number;
  price_data: {
    currency: "usd" | "cad";
    unit_amount: number;
    tax_behavior: "exclusive";
    product_data: { name: string; tax_code: string };
  };
};

// Stripe Tax code for general tangible/physical goods.
const PHYSICAL_GOODS_TAX_CODE = "txcd_99999999";

// Flat US import tariff, charged only on USD orders (our USD/CAD toggle is the
// US-buyer signal). Defined directly in USD cents — NOT converted from CAD.
export const US_TARIFF_CENTS = 1100; // $11.00 USD

// A tariff line item for USD orders, or null for CAD (no tariff).
export function tariffLineItem(currency: Currency): StripeLineItem | null {
  if (currency !== "USD") return null;
  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: US_TARIFF_CENTS,
      tax_behavior: "exclusive",
      product_data: { name: "US Import Tariff", tax_code: PHYSICAL_GOODS_TAX_CODE },
    },
  };
}

export function buildLineItems(
  items: CartItem[],
  currency: Currency = "CAD"
): StripeLineItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }
  return items.map((item) => {
    if (!Number.isInteger(item.qty) || item.qty <= 0) {
      throw new Error(`Invalid quantity for ${item.id}`);
    }
    const product = getProduct(item.id);
    if (!product) {
      throw new Error(`Unknown product: ${item.id}`);
    }
    return {
      quantity: item.qty,
      price_data: {
        currency: stripeCurrency(currency),
        unit_amount: convertCents(product.priceCents, currency),
        tax_behavior: "exclusive",
        product_data: {
          name: product.name + (item.size ? ` (${item.size})` : ""),
          tax_code: PHYSICAL_GOODS_TAX_CODE,
        },
      },
    };
  });
}
