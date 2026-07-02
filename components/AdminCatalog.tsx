"use client";
import { useState } from "react";

type P = {
  id: string;
  name: string;
  category: string;
  tagline?: string | null;
  notes?: string | null;
  description?: string | null;
  oil?: string | null;
  poster: string;
  video?: string | null;
  images?: string[] | null;
  audio: { muted: boolean; volume: number };
};

type Draft = {
  tagline: string;
  notes: string;
  description: string;
  oil: string;
  poster: string;
  video: string;
  images: string;
  audioMuted: boolean;
  audioVolume: number;
};

function toDraft(p: P): Draft {
  return {
    tagline: p.tagline ?? "",
    notes: p.notes ?? "",
    description: p.description ?? "",
    oil: p.oil ?? "",
    poster: p.poster ?? "",
    video: p.video ?? "",
    images: (p.images ?? []).join("\n"),
    audioMuted: p.audio.muted,
    audioVolume: p.audio.volume,
  };
}

export function AdminCatalog({ products }: { products: P[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(
    Object.fromEntries(products.map((p) => [p.id, toDraft(p)]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const set = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  async function save(p: P) {
    const d = drafts[p.id];
    setSaving(p.id);
    setSaved(null);
    try {
      const res = await fetch("/api/admin/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: p.id,
          tagline: d.tagline,
          notes: d.notes,
          description: d.description,
          oil: d.oil,
          poster: d.poster,
          video: d.video,
          images: d.images
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          audioMuted: d.audioMuted,
          audioVolume: d.audioVolume,
        }),
      });
      if (res.ok) setSaved(p.id);
    } catch {
      /* ignore */
    } finally {
      setSaving(null);
    }
  }

  const field =
    "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm";
  const lbl = "block text-xs opacity-70 space-y-1";

  return (
    <div className="space-y-6">
      {products.map((p) => {
        const d = drafts[p.id];
        return (
          <div
            key={p.id}
            className="rounded-xl p-4 space-y-3"
            style={{ background: "var(--card)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {p.name}{" "}
                <span className="opacity-50 text-sm">/ {p.category}</span>
              </h3>
              <span className="text-xs opacity-50">{p.id}</span>
            </div>

            <label className={lbl}>
              <span>Tagline</span>
              <input
                className={field}
                value={d.tagline}
                onChange={(e) => set(p.id, { tagline: e.target.value })}
              />
            </label>
            <label className={lbl}>
              <span>Notes</span>
              <input
                className={field}
                value={d.notes}
                onChange={(e) => set(p.id, { notes: e.target.value })}
              />
            </label>
            <label className={lbl}>
              <span>Description</span>
              <textarea
                rows={3}
                className={field}
                value={d.description}
                onChange={(e) => set(p.id, { description: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={lbl}>
                <span>Oil concentration</span>
                <input
                  className={field}
                  value={d.oil}
                  placeholder="e.g. 18%"
                  onChange={(e) => set(p.id, { oil: e.target.value })}
                />
              </label>
              <label className={lbl}>
                <span>Poster image URL</span>
                <input
                  className={field}
                  value={d.poster}
                  onChange={(e) => set(p.id, { poster: e.target.value })}
                />
              </label>
            </div>
            <label className={lbl}>
              <span>Video URL</span>
              <input
                className={field}
                value={d.video}
                placeholder="/media/....mp4"
                onChange={(e) => set(p.id, { video: e.target.value })}
              />
            </label>
            <label className={lbl}>
              <span>Gallery images (one URL per line)</span>
              <textarea
                rows={3}
                className={field}
                value={d.images}
                onChange={(e) => set(p.id, { images: e.target.value })}
              />
            </label>

            {d.video && (
              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2">
                <p className="text-xs font-medium opacity-70">Video audio</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={d.audioMuted}
                    onChange={(e) =>
                      set(p.id, { audioMuted: e.target.checked })
                    }
                  />
                  Muted by default
                </label>
                <label className="block text-xs opacity-70">
                  <span>Volume: {d.audioVolume}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={d.audioVolume}
                    onChange={(e) =>
                      set(p.id, { audioVolume: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </label>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saving === p.id}
                onClick={() => save(p)}
                className="rounded-full px-4 py-2 text-sm font-medium text-black border-2 border-black disabled:opacity-40"
                style={{ background: "var(--accent)" }}
              >
                {saving === p.id ? "Saving…" : "Save"}
              </button>
              {saved === p.id && (
                <span className="text-xs opacity-60">Saved. Live now.</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
