"use client";
import { useEffect, useMemo, useState } from "react";
import {
  OG_DEFAULTS,
  OG_RANGES,
  ogToSearch,
  ogFromSearch,
  type OgParams,
} from "@/lib/ogParams";

// OG card lab: a preset gallery of color/gradient/size variations plus a
// knobs playground. Playground state round-trips through the URL query
// (?...) so a tuned card is shareable by link, and named sets persist in
// localStorage (save / load / delete). Every image is the REAL renderer
// (/AB/OG/render) — what you see is byte-for-byte what would ship.

const STORAGE_KEY = "og-lab-sets";

// ── Preset gallery ──────────────────────────────────────────────────────
const PRESETS: { label: string; q: Partial<OgParams> }[] = [
  { label: "Shipping default", q: {} },
  { label: "Tight vignette (gr 45)", q: { gr: 45 } },
  { label: "Soft wash (gr 110)", q: { gr: 110 } },
  { label: "Centered glow", q: { gy: 50, gr: 60 } },
  { label: "Arctic night", q: { bg1: "0c1e37", bg2: "04070c" } },
  { label: "Deep sea", q: { bg1: "123a5c", bg2: "060b12", tc: "54c4f2" } },
  { label: "Charcoal flat", q: { bg1: "1c1c22", bg2: "121216", gr: 100 } },
  {
    label: "Light card",
    q: { bg1: "ffffff", bg2: "dfe9f2", word: "100f0d", ink: "100f0d", face: "ffffff", tc: "0d90d4" },
  },
  {
    label: "Ice-blue paper",
    q: { bg1: "eef6fc", bg2: "c9dcEB".toLowerCase(), word: "0a2540", ink: "0a2540", face: "f4f8fb", tc: "0a66a8" },
  },
  { label: "White slogan", q: { tc: "f5f5f5" } },
  { label: "Accent wordmark", q: { word: "34b6f5", tc: "f5f5f5" } },
  { label: "Big mark, small word", q: { cube: 260, dh: 184, ws: 60, gap: 20 } },
  { label: "Big word, small mark", q: { ws: 120, cube: 140, dh: 99, gap: 24 } },
  { label: "Cube only (no drop)", q: { dh: 0, cube: 230 } },
  { label: "No tagline", q: { tag: "", cube: 220, dh: 156 } },
  { label: "Violet exploration", q: { blue: "7c6cf5", drop: "9d8cff", tc: "9d8cff" } },
];

// ── Knob metadata ───────────────────────────────────────────────────────
const COLOR_KNOBS: { key: keyof OgParams; label: string }[] = [
  { key: "bg1", label: "Background inner" },
  { key: "bg2", label: "Background outer" },
  { key: "word", label: "Wordmark" },
  { key: "ink", label: "Outline ink" },
  { key: "face", label: "Cube faces" },
  { key: "blue", label: "Cube blue face" },
  { key: "drop", label: "Droplet" },
  { key: "tc", label: "Tagline" },
];
const RANGE_KNOBS: { key: keyof typeof OG_RANGES; label: string }[] = [
  { key: "gx", label: "Gradient center X (%)" },
  { key: "gy", label: "Gradient center Y (%)" },
  { key: "gr", label: "Gradient radius / intensity" },
  { key: "ws", label: "Wordmark size" },
  { key: "cube", label: "Cube height" },
  { key: "dh", label: "Droplet height" },
  { key: "ts", label: "Tagline size" },
  { key: "gap", label: "Block gap" },
];

const presetSrc = (q: Partial<OgParams>) =>
  `/AB/OG/render?${ogToSearch({ ...OG_DEFAULTS, ...q })}`;

export function OGLab() {
  const [p, setP] = useState<OgParams>(OG_DEFAULTS);
  // Debounced query string driving the live preview + URL.
  const [qs, setQs] = useState(() => ogToSearch(OG_DEFAULTS));
  const [sets, setSets] = useState<Record<string, string>>({});
  const [name, setName] = useState("");

  // Hydrate from the URL (shareable links) and localStorage once.
  useEffect(() => {
    setP(ogFromSearch(new URLSearchParams(window.location.search)));
    try {
      setSets(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
    } catch {
      /* corrupt storage — start empty */
    }
  }, []);

  // Debounce knob churn: one render request + one URL write per pause.
  useEffect(() => {
    const t = setTimeout(() => {
      const q = ogToSearch(p);
      setQs(q);
      window.history.replaceState(null, "", `?${q}`);
    }, 250);
    return () => clearTimeout(t);
  }, [p]);

  const set = (key: keyof OgParams, value: string | number) =>
    setP((prev) => ({ ...prev, [key]: value }));

  const persist = (next: Record<string, string>) => {
    setSets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full/blocked — state still updates for the session */
    }
  };

  const saveSet = () => {
    const n = name.trim();
    if (!n) return;
    persist({ ...sets, [n]: ogToSearch(p) });
    setName("");
  };
  const loadSet = (n: string) =>
    setP(ogFromSearch(new URLSearchParams(sets[n] ?? "")));
  const deleteSet = (n: string) => {
    const next = { ...sets };
    delete next[n];
    persist(next);
  };

  const setNames = useMemo(() => Object.keys(sets).sort(), [sets]);
  const input =
    "rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm";

  return (
    <div className="max-w-6xl mx-auto px-4 pb-24">
      <h1 className="text-2xl font-semibold mt-8 mb-2">OG card lab</h1>
      <p className="opacity-70 text-sm mb-8">
        Every image below is the real renderer — what you see is exactly what
        would ship. The playground state lives in the URL (copy it to share a
        candidate) and named sets persist in this browser.
      </p>

      {/* ── Playground ── */}
      <section className="grid lg:grid-cols-[1fr_320px] gap-8 items-start mb-14">
        <div className="lg:sticky lg:top-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/AB/OG/render?${qs}`}
            alt="OG card preview"
            width={1200}
            height={630}
            className="w-full h-auto rounded-xl border border-black/10 dark:border-white/10"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveSet()}
              placeholder="set name"
              className={`${input} flex-1 min-w-32`}
            />
            <button
              type="button"
              onClick={saveSet}
              disabled={!name.trim()}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-black border-2 border-black disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Save set
            </button>
            <button
              type="button"
              onClick={() => setP(OG_DEFAULTS)}
              className="rounded-full px-4 py-1.5 text-sm border border-black/20 dark:border-white/25"
            >
              Reset
            </button>
          </div>
          {setNames.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-3">
              {setNames.map((n) => (
                <li
                  key={n}
                  className="flex items-center gap-1 rounded-full border border-black/15 dark:border-white/20 pl-3 pr-1 py-0.5 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => loadSet(n)}
                    className="hover:opacity-70"
                    title={`Load “${n}”`}
                  >
                    {n}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSet(n)}
                    aria-label={`Delete set ${n}`}
                    className="w-5 h-5 grid place-items-center rounded-full text-xs opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-widest opacity-60 mb-2">
              Colors
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {COLOR_KNOBS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="color"
                    value={`#${p[key]}`}
                    onChange={(e) => set(key, e.target.value.slice(1))}
                    className="h-7 w-9 shrink-0 cursor-pointer rounded border border-black/15 dark:border-white/20 bg-transparent"
                  />
                  <span className="opacity-80">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium uppercase tracking-widest opacity-60 mb-2">
              Sizes &amp; gradient
            </h2>
            <div className="space-y-2">
              {RANGE_KNOBS.map(({ key, label }) => (
                <label key={key} className="block text-sm">
                  <span className="flex justify-between opacity-80">
                    <span>{label}</span>
                    <span className="tabular-nums">{p[key]}</span>
                  </span>
                  <input
                    type="range"
                    min={OG_RANGES[key][0]}
                    max={OG_RANGES[key][1]}
                    value={p[key]}
                    onChange={(e) => set(key, Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium uppercase tracking-widest opacity-60 mb-2">
              Tagline
            </h2>
            <input
              value={p.tag}
              onChange={(e) => set("tag", e.target.value)}
              placeholder="(empty = no tagline)"
              className={`${input} w-full`}
            />
          </div>
        </div>
      </section>

      {/* ── Preset gallery ── */}
      <h2 className="text-lg font-semibold mb-4">Variations</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRESETS.map(({ label, q }) => (
          <figure key={label}>
            <button
              type="button"
              onClick={() => {
                setP({ ...OG_DEFAULTS, ...q });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="block w-full text-left"
              title="Open in playground"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={presetSrc(q)}
                alt={label}
                width={1200}
                height={630}
                loading="lazy"
                className="w-full h-auto rounded-lg border border-black/10 dark:border-white/10 hover:opacity-90"
              />
            </button>
            <figcaption className="mt-1.5 text-xs opacity-60">{label}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
