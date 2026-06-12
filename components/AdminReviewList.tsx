"use client";
import { useState } from "react";

type AdminReview = {
  id: number;
  productName: string;
  authorName: string;
  rating: number;
  body: string;
  adminReply: string | null;
  createdAt: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

export function AdminReviewList({ reviews }: { reviews: AdminReview[] }) {
  const [list, setList] = useState(reviews);
  const [busy, setBusy] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [savingReply, setSavingReply] = useState<number | null>(null);

  async function saveReply(id: number, value: string) {
    setSavingReply(id);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, reply: value }),
      });
      if (res.ok) {
        const clean = value.trim();
        setList((l) =>
          l.map((r) =>
            r.id === id ? { ...r, adminReply: clean || null } : r
          )
        );
        setDrafts((d) => {
          const next = { ...d };
          delete next[id];
          return next;
        });
      } else {
        alert("Could not save reply (are you signed in as admin?)");
      }
    } catch {
      alert("Could not save reply.");
    } finally {
      setSavingReply(null);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this review? This can't be undone.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) setList((l) => l.filter((r) => r.id !== id));
      else alert("Could not delete (are you signed in as admin?)");
    } catch {
      alert("Could not delete.");
    } finally {
      setBusy(null);
    }
  }

  if (list.length === 0) {
    return <p className="opacity-70">No reviews yet.</p>;
  }

  return (
    <div className="space-y-3">
      {list.map((r) => (
        <div
          key={r.id}
          className="rounded-xl p-4"
          style={{ background: "var(--card)" }}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <p className="font-medium">
                {r.productName}{" "}
                <span style={{ color: "var(--accent)" }}>
                  {"★".repeat(r.rating)}
                </span>
                <span className="opacity-25">{"★".repeat(5 - r.rating)}</span>
              </p>
              <p className="text-sm opacity-70">
                {r.authorName} · {formatDate(r.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(r.id)}
              disabled={busy === r.id}
              className="text-red-500 text-sm underline whitespace-nowrap disabled:opacity-40"
            >
              {busy === r.id ? "Removing…" : "Remove"}
            </button>
          </div>
          {r.body && <p className="text-sm opacity-80 mt-2">{r.body}</p>}

          {r.id in drafts ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={drafts[r.id]}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                }
                placeholder="Write a public response…"
                rows={2}
                className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingReply === r.id}
                  onClick={() => saveReply(r.id, drafts[r.id])}
                  className="rounded-full px-3 py-1 text-xs font-medium text-black border-2 border-black disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  {savingReply === r.id ? "Saving…" : "Save reply"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((d) => {
                      const next = { ...d };
                      delete next[r.id];
                      return next;
                    })
                  }
                  className="text-xs underline opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : r.adminReply ? (
            <div
              className="mt-3 border-l-2 pl-3 py-1"
              style={{ borderColor: "var(--accent)" }}
            >
              <p className="text-xs font-semibold">
                Response from Ice Fragrances
              </p>
              <p className="text-sm opacity-80 mt-0.5">{r.adminReply}</p>
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setDrafts((d) => ({ ...d, [r.id]: r.adminReply ?? "" }))
                  }
                  className="text-xs underline opacity-60"
                >
                  Edit reply
                </button>
                <button
                  type="button"
                  disabled={savingReply === r.id}
                  onClick={() => saveReply(r.id, "")}
                  className="text-xs underline opacity-60 disabled:opacity-30"
                >
                  Remove reply
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDrafts((d) => ({ ...d, [r.id]: "" }))}
              className="text-xs underline opacity-60 mt-2"
            >
              Reply as Ice Fragrances
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
