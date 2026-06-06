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
          name: product.name,
          tax_code: PHYSICAL_GOODS_TAX_CODE,
        },
      },
    };
  });
}
