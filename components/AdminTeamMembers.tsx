"use client";
import { useState } from "react";

type Row = { email: string; bootstrap: boolean };

// Team membership: who can access the admin dashboard. Notification
// preferences live on their own subroute (components/AdminNotifications).
export function AdminTeamMembers({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            : [...l, { email: e, bootstrap: false }]
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
      <ul
        className="rounded-xl divide-y divide-black/10 dark:divide-white/10"
        style={{ background: "var(--card)" }}
      >
        {rows.map((r) => (
          <li
            key={r.email}
            className="flex items-center justify-between gap-3 py-3 px-4 text-sm"
          >
            <span>
              {r.email}
              {r.bootstrap && <span className="opacity-50"> (owner)</span>}
            </span>
            {!r.bootstrap && (
              <button
                type="button"
                onClick={() => removeAdmin(r)}
                className="text-red-500 underline text-xs"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

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
