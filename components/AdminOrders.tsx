"use client";
import { useMemo, useState } from "react";
import { useToast } from "@/lib/toastStore";
import { formatMoney } from "@/lib/currency";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/db/schema";
import { Chevron } from "@/components/Chevron";

type Order = {
  id: number;
  createdAt: string;
  email: string | null;
  name: string | null;
  totalCents: number;
  currency: string;
  taxCents: number | null;
  status: string;
  trackingNumber: string | null;
  adminNote: string | null;
  testMode: boolean;
  paymentIntentId: string | null;
  ship: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal: string | null;
    country: string | null;
  };
  items: { name: string; qty: number; size: string | null }[];
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  fulfilled: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  cancelled: "bg-neutral-500/15 opacity-70",
  refunded: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

function addressLines(s: Order["ship"]): string[] {
  const cityLine = [s.city, s.state, s.postal].filter(Boolean).join(" ");
  return [s.name, s.line1, s.line2, cityLine, s.country].filter(
    (l): l is string => !!l && l.trim() !== ""
  );
}

export function AdminOrders({ initial }: { initial: Order[] }) {
  const [rows, setRows] = useState(initial);
  const [showTest, setShowTest] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const toast = useToast((s) => s.show);

  const visible = useMemo(
    () => rows.filter((o) => showTest || !o.testMode),
    [rows, showTest]
  );

  // Revenue excludes test orders always, and is split by settlement currency —
  // summing USD and CAD into one number would be meaningless.
  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const o of rows) {
      if (o.testMode || o.status === "refunded" || o.status === "cancelled") continue;
      acc[o.currency] = (acc[o.currency] ?? 0) + o.totalCents;
    }
    return acc;
  }, [rows]);

  const testCount = rows.filter((o) => o.testMode).length;

  async function patch(id: number, body: Record<string, unknown>) {
    setBusy(id);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      toast("Couldn't update that order.");
      return false;
    }
    setRows((l) => l.map((o) => (o.id === id ? { ...o, ...body } : o)));
    return true;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(totals).map(([cur, cents]) => (
            <span key={cur} className="font-semibold">
              {formatMoney(cents, cur)}
            </span>
          ))}
          <span className="opacity-60">
            {visible.length} order{visible.length === 1 ? "" : "s"}
          </span>
        </div>
        {testCount > 0 && (
          <label className="flex items-center gap-2 opacity-80">
            <input
              type="checkbox"
              checked={showTest}
              onChange={(e) => setShowTest(e.target.checked)}
              className="h-4 w-4 cursor-pointer"
            />
            Show {testCount} test order{testCount === 1 ? "" : "s"}
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="opacity-70">No orders yet.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((o) => {
            const isOpen = open === o.id;
            return (
              <li
                key={o.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--card)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : o.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-4 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Chevron dir={isOpen ? "down" : "right"} className="opacity-50" />
                  <span className="font-medium">#{o.id}</span>
                  <span className="opacity-60 hidden sm:inline">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex-1 truncate opacity-80">
                    {o.name || o.email || "Guest"}
                  </span>
                  {o.testMode && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-black">
                      TEST
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      STATUS_STYLE[o.status] ?? ""
                    }`}
                  >
                    {o.status}
                  </span>
                  <span className="font-semibold whitespace-nowrap">
                    {formatMoney(o.totalCents, o.currency)}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-black/10 dark:border-white/10 p-4 grid gap-5 sm:grid-cols-2 text-sm">
                    <div>
                      <h3 className="font-medium mb-2">Items</h3>
                      <ul className="space-y-1 opacity-80">
                        {o.items.length ? (
                          o.items.map((it, i) => (
                            <li key={i}>
                              {it.name} × {it.qty}
                            </li>
                          ))
                        ) : (
                          <li className="opacity-60">No line items recorded.</li>
                        )}
                      </ul>
                      <p className="mt-3 opacity-60">
                        Total {formatMoney(o.totalCents, o.currency)}
                        {o.taxCents != null &&
                          ` · tax ${formatMoney(o.taxCents, o.currency)}`}
                      </p>
                      {o.email && (
                        <p className="mt-1 opacity-60 break-all">{o.email}</p>
                      )}
                      {o.paymentIntentId && (
                        <a
                          href={`https://dashboard.stripe.com/${o.testMode ? "test/" : ""}payments/${o.paymentIntentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 underline opacity-70 hover:opacity-100"
                        >
                          View in Stripe
                          <Chevron />
                        </a>
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Ship to</h3>
                      {addressLines(o.ship).length ? (
                        <address className="not-italic opacity-80 leading-relaxed">
                          {addressLines(o.ship).map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </address>
                      ) : (
                        <p className="opacity-60">
                          No address recorded — check Stripe.
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <select
                          value={o.status}
                          disabled={busy === o.id}
                          onChange={(e) => {
                            const status = e.target.value as OrderStatus;
                            void patch(o.id, {
                              status,
                              // Stamp/clear the fulfilment time with the status.
                              fulfilledAt:
                                status === "fulfilled"
                                  ? new Date().toISOString()
                                  : null,
                            }).then(
                              (okay) => okay && toast(`Order #${o.id} → ${status}`)
                            );
                          }}
                          className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <input
                          defaultValue={o.trackingNumber ?? ""}
                          placeholder="Tracking number"
                          disabled={busy === o.id}
                          onBlur={(e) => {
                            const v = e.target.value.trim() || null;
                            if (v === (o.trackingNumber ?? null)) return;
                            void patch(o.id, { trackingNumber: v }).then(
                              (okay) => okay && toast("Tracking saved.")
                            );
                          }}
                          className="flex-1 min-w-40 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
                        />
                      </div>
                      <textarea
                        defaultValue={o.adminNote ?? ""}
                        placeholder="Internal note (never shown to the customer)"
                        rows={2}
                        disabled={busy === o.id}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v === (o.adminNote ?? null)) return;
                          void patch(o.id, { adminNote: v }).then(
                            (okay) => okay && toast("Note saved.")
                          );
                        }}
                        className="mt-2 w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
