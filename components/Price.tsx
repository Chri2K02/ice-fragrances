import { formatPrice } from "@/lib/currency";

// Renders BOTH currency variants and lets CSS reveal the right one (see the
// .cur-swap rules in globals.css, keyed on the attribute public/boot.js writes
// before first paint).
//
// Why not just read the store: the store is only correct after hydration, so a
// server-rendered price showed CAD and then flipped to USD for anyone browsing
// in USD. Rendering both means the first paint is already right — and since
// the markup is identical on server and client, there's no hydration mismatch
// either. Screen readers get the hidden variant's display:none treatment, so
// only the active price is announced.
export function Price({
  cents,
  className,
}: {
  /** Base price in CAD cents — formatPrice converts for USD. */
  cents: number;
  className?: string;
}) {
  return (
    <span className={`cur-swap ${className ?? ""}`}>
      <span data-cur="CAD">{formatPrice(cents, "CAD")}</span>
      <span data-cur="USD">{formatPrice(cents, "USD")}</span>
    </span>
  );
}
