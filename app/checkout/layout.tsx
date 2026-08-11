import type { Metadata } from "next";

// The checkout page is a client component, so its metadata lives here. It is
// cart-state-specific and useless in an index — noindex pairs with the
// /checkout disallow in app/robots.ts (same belt-and-suspenders as /account).
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
