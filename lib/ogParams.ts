// Parameter model for the hand-composed OG card (lib/ogCard.tsx). Isomorphic
// on purpose: the /AB/OG playground (client) builds query strings from it and
// the render route (server) parses them back, so both sides share one source
// of defaults, ranges, and (de)serialization. Colors travel hex-without-#.

export type OgParams = {
  bg1: string; // gradient inner color
  bg2: string; // gradient outer color
  gx: number; // gradient center x (%)
  gy: number; // gradient center y (%)
  gr: number; // gradient radius (%): lower = tighter vignette
  word: string; // wordmark color
  ws: number; // wordmark font size (px)
  ink: string; // cube outline color
  face: string; // cube light-face color
  blue: string; // cube blue-face color
  drop: string; // droplet color
  cube: number; // cube height (px)
  dh: number; // droplet height (px)
  tag: string; // tagline text
  tc: string; // tagline color
  ts: number; // tagline font size (px)
  gap: number; // vertical gap between blocks (px)
};

// Defaults reproduce the shipped brand card: dark radial surface, light
// lockup, sky-blue slogan.
export const OG_DEFAULTS: OgParams = {
  bg1: "41414b",
  bg2: "060606",
  gx: 50,
  gy: 20,
  gr: 72,
  word: "f5f5f5",
  ws: 84,
  ink: "ffffff",
  face: "100f0d",
  blue: "66a4de",
  drop: "54c4f2",
  cube: 190,
  dh: 134,
  tag: "Reinvent Yourself",
  tc: "34b6f5",
  ts: 40,
  gap: 28,
};

export const OG_SIZE = { width: 1200, height: 630 };

type NumKey = { [K in keyof OgParams]: OgParams[K] extends number ? K : never }[keyof OgParams];
type StrKey = Exclude<keyof OgParams, NumKey>;

// Knob ranges — also the server-side clamp, so a hand-edited URL can't ask
// satori for absurd geometry.
export const OG_RANGES: Record<NumKey, [number, number]> = {
  gx: [0, 100],
  gy: [0, 100],
  gr: [15, 130],
  ws: [36, 150],
  cube: [70, 330],
  dh: [0, 250],
  ts: [18, 84],
  gap: [0, 90],
};

const COLOR_KEYS: StrKey[] = ["bg1", "bg2", "word", "ink", "face", "blue", "drop", "tc"];
export const OG_COLOR_KEYS = COLOR_KEYS.filter((k) => k !== "tag");

const HEX = /^[0-9a-fA-F]{6}$/;

export function ogToSearch(p: OgParams): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) q.set(k, String(v));
  return q.toString();
}

export function ogFromSearch(q: URLSearchParams): OgParams {
  const p: OgParams = { ...OG_DEFAULTS };
  for (const k of Object.keys(OG_RANGES) as NumKey[]) {
    const s = q.get(k);
    // Absent params keep their default — Number(null) is 0, which would
    // otherwise clamp every missing knob to its range minimum.
    if (s === null || s === "") continue;
    const raw = Number(s);
    if (Number.isFinite(raw)) {
      const [lo, hi] = OG_RANGES[k];
      p[k] = Math.min(hi, Math.max(lo, raw));
    }
  }
  for (const k of COLOR_KEYS) {
    const raw = q.get(k);
    if (raw && HEX.test(raw)) p[k] = raw.toLowerCase();
  }
  const tag = q.get("tag");
  if (tag !== null) p.tag = tag.slice(0, 60);
  return p;
}
