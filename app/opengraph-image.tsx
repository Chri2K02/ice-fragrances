import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OgCard } from "@/lib/ogCard";
import { OG_DEFAULTS, OG_SIZE } from "@/lib/ogParams";

// Branded 1200×630 social card, HAND-COMPOSED from the live brand assets
// (wordmark in Glacial Bold + the cube/droplet SVG paths shared with
// Logo.tsx) instead of a pre-baked PNG — one parameter set (lib/ogParams)
// drives this, and /AB/OG explores variations of the same card. Statically
// generated at build time. twitter-image.tsx re-exports this so both cards
// stay in sync.
export const alt = "Ice Fragrances — Reinvent Yourself";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const glacialBold = await readFile(
    join(process.cwd(), "app/fonts/GlacialIndifference-Bold.otf")
  );

  return new ImageResponse(<OgCard p={OG_DEFAULTS} />, {
    ...OG_SIZE,
    fonts: [{ name: "Glacial", data: glacialBold, style: "normal", weight: 700 }],
  });
}
