import { describe, it, expect, beforeEach } from "vitest";
import { useCart } from "@/lib/cartStore";

describe("cartStore", () => {
  beforeEach(() => useCart.getState().clear());

  it("adds an item and computes the total", () => {
    useCart.getState().add("frost-mind");
    const s = useCart.getState();
    expect(s.items).toEqual([{ id: "frost-mind", qty: 1 }]);
    expect(s.totalCents()).toBe(10800);
  });

  it("increments quantity when the same item is added twice", () => {
    useCart.getState().add("humidifier");
    useCart.getState().add("humidifier");
    const s = useCart.getState();
    expect(s.items).toEqual([{ id: "humidifier", qty: 2 }]);
    expect(s.totalCents()).toBe(7600);
  });

  it("removes an item", () => {
    useCart.getState().add("frost-mind");
    useCart.getState().remove("frost-mind");
    expect(useCart.getState().items).toEqual([]);
  });

  it("decrements quantity, removing the line when it hits zero", () => {
    useCart.getState().add("humidifier");
    useCart.getState().add("humidifier"); // qty 2
    useCart.getState().decrement("humidifier"); // qty 1
    expect(useCart.getState().items).toEqual([{ id: "humidifier", qty: 1 }]);
    useCart.getState().decrement("humidifier"); // qty 0 -> removed
    expect(useCart.getState().items).toEqual([]);
  });

  it("counts total quantity", () => {
    useCart.getState().add("frost-mind");
    useCart.getState().add("humidifier");
    expect(useCart.getState().count()).toBe(2);
  });
});
