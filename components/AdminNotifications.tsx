"use client";
import { useState } from "react";

type Row = { email: string; notify: Record<string, boolean>; active: boolean };
type Type = { key: string; label: string };

// Per-admin notification matrix. Membership/access lives on the Team subroute
// (components/AdminTeamMembers); rows without access are dimmed — their prefs
// persist but no email is sent. "Send test" delivers a sample email so
// delivery can be verified end-to-end.
export function AdminNotifications({
  initial,
  types,
}: {
  initial: Row[];
  types: Type[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [testState, setTestState] = useState<Record<string, string>>({});

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

  async function sendTest(r: Row) {
    setTestState((s) => ({ ...s, [r.email]: "Sending…" }));
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: r.email }),
      });
      const d = await res.json();
      setTestState((s) => ({
        ...s,
        [r.email]: !res.ok
          ? (d.error ?? "Failed")
          : d.configured
            ? "Sent ✓"
            : "Email not configured",
      }));
    } catch {
      setTestState((s) => ({ ...s, [r.email]: "Failed" }));
    }
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
            <th className="py-3 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.email}
              className={`border-t border-black/10 dark:border-white/10 ${
                r.active ? "" : "opacity-40"
              }`}
              title={
                r.active ? undefined : "No admin access — receives no emails"
              }
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
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => sendTest(r)}
                  disabled={testState[r.email] === "Sending…"}
                  className="underline text-xs opacity-70 hover:opacity-100 disabled:opacity-40"
                >
                  Send test
                </button>
                {testState[r.email] && testState[r.email] !== "Sending…" && (
                  <span className="ml-2 text-xs opacity-70">
                    {testState[r.email]}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
