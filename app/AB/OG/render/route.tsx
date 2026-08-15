import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OgCard } from "@/lib/ogCard";
import { OG_SIZE, ogFromSearch } from "@/lib/ogParams";

// Parameterized preview renderer for the OG card: same composition the real
// opengraph-image ships, drawn from query params (parsed + clamped by
// ogFromSearch) so /AB/OG can render arbitrary variations as plain <img>
// tags. Internal tool — nothing links here and the page is noindexed.
export async function GET(req: Request) {
  const p = ogFromSearch(new URL(req.url).searchParams);
  const glacialBold = await readFile(
    join(process.cwd(), "app/fonts/GlacialIndifference-Bold.otf")
  );

  return new ImageResponse(<OgCard p={p} />, {
    ...OG_SIZE,
    fonts: [{ name: "Glacial", data: glacialBold, style: "normal", weight: 700 }],
  });
}
