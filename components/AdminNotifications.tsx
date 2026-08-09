"use client";
import { useState } from "react";

type Row = { email: string; notify: Record<string, boolean> };
type Type = { key: string; label: string };

// Per-admin notification matrix. Membership (add/remove) lives on its own
// subroute (components/AdminTeamMembers).
export function AdminNotifications({
  initial,
  types,
}: {
  initial: Row[];
  types: Type[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);

  // Missing key = default on (matches recipientsFor on the server).
  const on = (r: Row, key: string) => r.notify?.[key] ?? true;

  async function toggle(r: Row, key: string) {
    const next = { ...(r.notify ?? {}) };
    next[key] = !on(r, key);
    setRows((l) =>
      l.map((x) => (x.email === r.email ? { ...x, notify: next } : x))
    );
    await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: r.email, notify: next }),
    }).catch(() => {});
  }

  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{ background: "var(--card)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-3 px-4 font-medium">Admin</th>
            {types.map((t) => (
              <th key={t.key} className="py-3 px-2 font-medium text-center">
                {t.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.email}
              className="border-t border-black/10 dark:border-white/10"
            >
              <td className="py-3 px-4">{r.email}</td>
              {types.map((t) => (
                <td key={t.key} className="py-3 px-2 text-center">
                  <input
                    type="checkbox"
                    checked={on(r, t.key)}
                    onChange={() => toggle(r, t.key)}
                    aria-label={`${r.email}: ${t.label}`}
                    className="h-4 w-4 cursor-pointer"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
