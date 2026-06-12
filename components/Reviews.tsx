"use client";
import { useEffect, useState } from "react";

type ReviewItem = {
  id: number;
  authorName: string;
  rating: number;
  body: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
};
type Data = {
  count: number;
  average: number;
  reviews: ReviewItem[];
  signedIn: boolean;
  canReview: boolean;
  alreadyReviewed: boolean;
  isAdmin: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// The store's public reply to a single review. Everyone sees an existing
// reply; the admin gets inline controls to write, edit, or remove it.
function ReplyBlock({
  reviewId,
  reply,
  isAdmin,
  onChanged,
}: {
  reviewId: number;
  reply: string | null;
  isAdmin: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reply ?? "");
  const [saving, setSaving] = useState(false);

  async function save(value: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, reply: value }),
      });
      if (res.ok) {
        setEditing(false);
        await onChanged();
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-2 ml-4 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a public response…"
          rows={2}
          className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(draft)}
            className="rounded-full px-3 py-1 text-xs font-medium text-black border-2 border-black disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {saving ? "Saving…" : "Save reply"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(reply ?? "");
              setEditing(false);
            }}
            className="text-xs underline opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (reply) {
    return (
      <div
        className="mt-2 ml-4 border-l-2 pl-3 py-1"
        style={{ borderColor: "var(--accent)" }}
      >
        <p className="text-xs font-semibold">Response from Ice Fragrances</p>
        <p className="opacity-80 mt-0.5">{reply}</p>
        {isAdmin && (
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs underline opacity-60"
            >
              Edit reply
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save("")}
              className="text-xs underline opacity-60 disabled:opacity-30"
            >
              Remove reply
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!isAdmin) return null;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-xs underline opacity-60 mt-1 ml-4"
    >
      Reply as Ice Fragrances
    </button>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value.toFixed(1)} out of 5`}>
      <span style={{ color: "var(--accent)" }}>{"★★★★★".slice(0, full)}</span>
      <span className="opacity-25">{"★★★★★".slice(full)}</span>
    </span>
  );
}

export function Reviews({ productId }: { productId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      setData(await res.json());
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, body }),
      });
      const d = await res.json();
      if (d.ok) {
        setBody("");
        await load();
      } else {
        setError(d.error ?? "Could not post review");
      }
    } catch {
      setError("Could not post review");
    } finally {
      setSubmitting(false);
    }
  }

  async function del(id: number) {
    if (!confirm("Delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch {
      /* ignore */
    }
  }

  if (!data) return null;

  return (
    <div className="mt-2 text-sm normal-case">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 hover:opacity-70"
      >
        <Stars value={data.average} />
        <span className="opacity-70">
          {data.count ? `${data.average.toFixed(1)} (${data.count})` : "No reviews yet"}
        </span>
        <span className="opacity-50">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {data.reviews.map((r) => (
            <div
              key={r.id}
              className="border-t border-black/10 dark:border-white/10 pt-2"
            >
              <div className="flex justify-between items-start gap-2">
                <Stars value={r.rating} />
                <span className="text-xs flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                  <span className="font-medium">{r.authorName}</span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-black whitespace-nowrap"
                    style={{ background: "var(--accent)" }}
                    title="Purchased this product"
                  >
                    ✓ Verified Buyer
                  </span>
                  {data.isAdmin && (
                    <button
                      type="button"
                      onClick={() => del(r.id)}
                      className="text-red-500 underline"
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>
              {r.createdAt && (
                <p className="opacity-50 text-xs mt-0.5">
                  Reviewed {formatDate(r.createdAt)}
                </p>
              )}
              {r.body && <p className="opacity-80 mt-1">{r.body}</p>}
              <ReplyBlock
                reviewId={r.id}
                reply={r.adminReply}
                isAdmin={data.isAdmin}
                onChanged={load}
              />
            </div>
          ))}

          <div className="border-t border-black/10 dark:border-white/10 pt-3">
            {!data.signedIn && (
              <p className="opacity-70">
                Purchased this?{" "}
                <a href="/sign-in" className="underline">
                  Sign in
                </a>{" "}
                to leave a review.
              </p>
            )}
            {data.signedIn && data.alreadyReviewed && (
              <p className="opacity-70">You&apos;ve reviewed this item.</p>
            )}
            {data.signedIn && !data.alreadyReviewed && !data.canReview && (
              <p className="opacity-70">Only verified buyers can review this item.</p>
            )}
            {data.canReview && (
              <div className="space-y-2">
                <div className="flex gap-1 text-lg">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      style={n <= rating ? { color: "var(--accent)" } : undefined}
                      className={n <= rating ? "" : "opacity-30"}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share your thoughts (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2"
                />
                {error && <p className="text-red-500">{error}</p>}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="rounded-full px-4 py-2 font-medium text-black border-2 border-black disabled:opacity-40"
                  style={{ background: "var(--accent)" }}
                >
                  {submitting ? "Posting…" : "Post review"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
