import { getProduct } from "@/lib/products";
import type { CartItem } from "@/lib/cartStore";

export type StripeLineItem = {
  quantity: number;
  price_data: {
    currency: "usd";
    unit_amount: number;
    product_data: { name: string };
  };
};

export function buildLineItems(items: CartItem[]): StripeLineItem[] {
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
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: { name: product.name },
      },
    };
  });
}
