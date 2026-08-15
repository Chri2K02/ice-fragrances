import { getStripePayments } from "@/lib/stripeAdmin";
import { formatMoney } from "@/lib/currency";
import { StripeEmpty } from "@/components/StripeEmpty";
import { Chevron } from "@/components/Chevron";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Stripe payments",
  robots: { index: false, follow: false },
};

// Stripe's own status vocabulary, kept verbatim rather than translated — it's
// what the Stripe dashboard and docs use, so it stays searchable.
const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  processing: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  requires_payment_method: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  requires_action: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  canceled: "bg-neutral-500/15 opacity-70",
};

export default async function StripePaymentsPage() {
  const { data, error, mode } = await getStripePayments();
  if (error) return <StripeEmpty message={error} />;
  if (!data?.length) {
    return (
      <StripeEmpty
        message={`No ${mode === "test" ? "test" : "live"} payments yet.`}
      />
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)" }}>
      <ul className="divide-y divide-black/10 dark:divide-white/10">
        {data.map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatMoney(p.amount, p.currency)}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${
                    STATUS_STYLE[p.status] ?? "bg-neutral-500/15"
                  }`}
                >
                  {p.status.replace(/_/g, " ")}
                </span>
                {p.refunded && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                    refunded
                  </span>
                )}
              </div>
              <div className="opacity-60 truncate">
                {p.email ?? p.description ?? p.id}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="opacity-60 whitespace-nowrap">
                {new Date(p.created * 1000).toLocaleDateString()}
              </div>
              <a
                href={`https://dashboard.stripe.com/${mode === "test" ? "test/" : ""}payments/${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline opacity-70 hover:opacity-100"
              >
                Stripe
                <Chevron />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
