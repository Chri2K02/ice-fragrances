import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProduct } from "@/lib/products";

export type CartItem = { id: string; qty: number };

type CartState = {
  items: CartItem[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: () => number;
  totalCents: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (id) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, qty: i.qty + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { id, qty: 1 }] };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      totalCents: () =>
        get().items.reduce((sum, i) => {
          const p = getProduct(i.id);
          return sum + (p ? p.priceCents * i.qty : 0);
        }, 0),
    }),
    { name: "icefrag-cart" }
  )
);
