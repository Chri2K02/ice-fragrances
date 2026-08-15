import { getStripeOverview } from "@/lib/stripeAdmin";
import { formatMoney } from "@/lib/currency";
import { StripeEmpty } from "@/components/StripeEmpty";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Stripe",
  robots: { index: false, follow: false },
};

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)" }}>
      <p className="text-xs uppercase tracking-widest opacity-60">{label}</p>
      <div className="mt-1 text-lg font-semibold">{children}</div>
    </div>
  );
}

export default async function StripeOverviewPage() {
  const { data, error } = await getStripeOverview();
  if (error || !data) return <StripeEmpty message={error} />;

  const money = (rows: { amount: number; currency: string }[]) =>
    rows.length
      ? rows.map((b) => formatMoney(b.amount, b.currency)).join(" · ")
      : "—";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Available balance">{money(data.available)}</Stat>
        <Stat label="Pending">{money(data.pending)}</Stat>
        <Stat label="Account">{data.accountName ?? "Ice Fragrances"}</Stat>
        <Stat label="Status">
          <span className="flex flex-wrap gap-2 text-sm">
            <span
              className={`rounded-full px-2 py-0.5 ${
                data.chargesEnabled
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  : "bg-red-500/15 text-red-600 dark:text-red-300"
              }`}
            >
              {data.chargesEnabled ? "charges on" : "charges off"}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 ${
                data.payoutsEnabled
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              }`}
            >
              {data.payoutsEnabled ? "payouts on" : "payouts off"}
            </span>
          </span>
        </Stat>
      </div>
      <p className="text-sm opacity-60">
        Balances are what Stripe holds, not revenue — money sits here until it
        is paid out. Order history and fulfilment live under Orders.
      </p>
    </div>
  );
}
