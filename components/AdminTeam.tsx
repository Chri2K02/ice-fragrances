"use client";
import { useState } from "react";

type Row = { email: string; notify: Record<string, boolean>; bootstrap: boolean };
type Type = { key: string; label: string };

export function AdminTeam({
  initial,
  types,
}: {
  initial: Row[];
  types: Type[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Missing key = default on (matches recipientsFor on the server).
  const on = (r: Row, key: string) => r.notify?.[key] ?? true;

  async function addAdmin() {
    const e = email.trim().toLowerCase();
    if (!e) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const d = await res.json();
      if (res.ok) {
        setRows((l) =>
          l.some((x) => x.email === e)
            ? l
            : [...l, { email: e, notify: {}, bootstrap: false }]
        );
        setEmail("");
      } else {
        setError(d.error ?? "Could not add admin");
      }
    } catch {
      setError("Could not add admin");
    } finally {
      setBusy(false);
    }
  }

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

  async function removeAdmin(r: Row) {
    if (r.bootstrap) return;
    if (!confirm(`Remove ${r.email} from the team?`)) return;
    setRows((l) => l.filter((x) => x.email !== r.email));
    await fetch(`/api/admin/team?email=${encodeURIComponent(r.email)}`, {
      method: "DELETE",
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--card)" }}>
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
                className="border-t border-black/10 dark:border-white/10"
              >
                <td className="py-3 px-4">
                  {r.email}
                  {r.bootstrap && <span className="opacity-50"> (owner)</span>}
                </td>
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
                <td className="py-3 px-4 text-right">
                  {!r.bootstrap && (
                    <button
                      type="button"
                      onClick={() => removeAdmin(r)}
                      className="text-red-500 underline text-xs"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addAdmin()}
          placeholder="new-admin@email.com"
          type="email"
          className="flex-1 rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={addAdmin}
          className="rounded-full px-4 py-2 text-sm font-medium text-black border-2 border-black disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {busy ? "Adding…" : "Add admin"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
