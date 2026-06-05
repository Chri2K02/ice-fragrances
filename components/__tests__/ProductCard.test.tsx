import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cartStore";
import { PRODUCTS } from "@/lib/products";

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  global.IntersectionObserver = IO;
  window.HTMLMediaElement.prototype.play = async () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
});

beforeEach(() => useCart.getState().clear());

const product = PRODUCTS[0]; // Frost Mind

describe("ProductCard", () => {
  it("shows the photo first and flips to the video on arrow click", async () => {
    render(<ProductCard product={product} />);
    expect(screen.getByTestId("product-photo")).toBeInTheDocument();
    expect(screen.queryByTestId("video")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show video/i }));
    expect(screen.getByTestId("video")).toBeInTheDocument();
    expect(screen.queryByTestId("product-photo")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /show photo/i }));
    expect(screen.getByTestId("product-photo")).toBeInTheDocument();
  });

  it("adds the product to the cart", async () => {
    render(<ProductCard product={product} />);
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(useCart.getState().items).toEqual([{ id: product.id, qty: 1 }]);
  });

  it("displays the formatted price", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("$108.00")).toBeInTheDocument();
  });
});
