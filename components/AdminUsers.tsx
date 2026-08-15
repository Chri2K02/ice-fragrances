"use client";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/currency";
import type { AdminUserRow } from "@/app/admin/users/page";

type SortKey = "recent" | "spend" | "orders" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "spend", label: "Spend" },
  { key: "orders", label: "Orders" },
  { key: "name", label: "Name" },
];

// Ranking across mixed currencies needs ONE comparable number. This is for
// ordering only — displayed amounts always stay in their own currency.
const CAD_PER_USD = 1 / 0.72;
const rankSpend = (spend: Record<string, number>) =>
  Object.entries(spend).reduce(
    (sum, [cur, cents]) => sum + (cur === "USD" ? cents * CAD_PER_USD : cents),
    0
  );

export function AdminUsers({ initial }: { initial: AdminUserRow[] }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? initial.filter(
          (u) =>
            u.email.toLowerCase().includes(needle) ||
            u.name.toLowerCase().includes(needle)
        )
      : initial;
    const sorted = [...filtered];
    if (sort === "spend") sorted.sort((a, b) => rankSpend(b.spend) - rankSpend(a.spend));
    else if (sort === "orders") sorted.sort((a, b) => b.orderCount - a.orderCount);
    else if (sort === "name")
      sorted.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    // "recent" keeps the server's ordering (last order, else signup).
    return sorted;
  }, [initial, sort, q]);

  const customers = initial.filter((u) => u.orderCount > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="opacity-70">
          {initial.length} user{initial.length === 1 ? "" : "s"} · {customers}{" "}
          with orders
        </span>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-1.5 text-sm"
          />
          <div className="flex gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  sort === s.key
                    ? "font-semibold"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={
                  sort === s.key
                    ? { background: "var(--accent)", color: "#000" }
                    : undefined
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="opacity-70">No users match that search.</p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ background: "var(--card)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-2 font-medium text-center">Orders</th>
                <th className="py-3 px-2 font-medium text-right">Spend</th>
                <th className="py-3 px-2 font-medium text-center">Reviews</th>
                <th className="py-3 px-4 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-black/10 dark:border-white/10"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.name || "—"}</span>
                      {u.isAdmin && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-black"
                          style={{ background: "var(--accent)" }}
                        >
                          ADMIN
                        </span>
                      )}
                      {!u.emailVerified && (
                        <span
                          className="rounded-full bg-black/10 dark:bg-white/15 px-2 py-0.5 text-[10px]"
                          title="Email never verified"
                        >
                          unverified
                        </span>
                      )}
                    </div>
                    <div className="opacity-60 break-all">{u.email}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    {u.orderCount || <span className="opacity-40">—</span>}
                  </td>
                  <td className="py-3 px-2 text-right whitespace-nowrap">
                    {Object.keys(u.spend).length === 0 ? (
                      <span className="opacity-40">—</span>
                    ) : (
                      Object.entries(u.spend).map(([cur, cents]) => (
                        <div key={cur}>{formatMoney(cents, cur)}</div>
                      ))
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {u.reviewCount || <span className="opacity-40">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right opacity-60 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
