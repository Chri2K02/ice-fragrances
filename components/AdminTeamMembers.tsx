"use client";
import { useState } from "react";

type Row = {
  email: string;
  perms: Record<string, boolean>;
  bootstrap: boolean;
};
type Type = { key: string; label: string };

// Admin management: one row per email, one Access checkbox per admin surface
// (missing/false = no access; none at all = not an admin). "Revoke" only
// clears permissions — the row and its notification prefs persist. Notification
// toggles live on the Notifications subroute (components/AdminNotifications).
export function AdminTeamMembers({
  initial,
  permTypes,
}: {
  initial: Row[];
  permTypes: Type[];
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Missing perm key = no access (deny by default). Owner always has access.
  const permOn = (r: Row, key: string) =>
    r.bootstrap || r.perms?.[key] === true;

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
            : [...l, { email: e, perms: {}, bootstrap: false }]
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

  async function togglePerm(r: Row, key: string) {
    if (r.bootstrap) return;
    const next = { ...(r.perms ?? {}) };
    next[key] = !permOn(r, key);
    setRows((l) =>
      l.map((x) => (x.email === r.email ? { ...x, perms: next } : x))
    );
    await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: r.email, perms: next }),
    }).catch(() => {});
  }

  async function revokeAdmin(r: Row) {
    if (r.bootstrap) return;
    if (!confirm(`Revoke all admin access for ${r.email}?`)) return;
    // The row stays — only the permissions are cleared.
    setRows((l) =>
      l.map((x) => (x.email === r.email ? { ...x, perms: {} } : x))
    );
    await fetch(`/api/admin/team?email=${encodeURIComponent(r.email)}`, {
      method: "DELETE",
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div
        className="overflow-x-auto rounded-xl"
        style={{ background: "var(--card)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-3 px-4 font-medium">Admin</th>
              {permTypes.map((t) => (
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
                {permTypes.map((t) => (
                  <td key={t.key} className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={permOn(r, t.key)}
                      disabled={r.bootstrap}
                      onChange={() => togglePerm(r, t.key)}
                      aria-label={`${r.email}: ${t.label} access`}
                      className="h-4 w-4 cursor-pointer disabled:cursor-default disabled:opacity-60"
                    />
                  </td>
                ))}
                <td className="py-3 px-4 text-right">
                  {!r.bootstrap && (
                    <button
                      type="button"
                      onClick={() => revokeAdmin(r)}
                      className="text-red-500 underline text-xs"
                    >
                      Revoke
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
