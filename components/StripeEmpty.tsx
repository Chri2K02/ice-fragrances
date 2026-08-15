// Shared failure/empty state for the Stripe section, so a Stripe outage (or a
// key that isn't valid for the current mode) degrades to a readable panel
// instead of a 500. Used by every section page.
export function StripeEmpty({
  message,
  children,
}: {
  message?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-6 text-sm opacity-80"
      style={{ background: "var(--card)" }}
    >
      <p>{message ?? "Nothing to show yet."}</p>
      {children}
    </div>
  );
}
