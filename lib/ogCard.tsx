import type { OgParams } from "@/lib/ogParams";
import { OG_SIZE } from "@/lib/ogParams";

// The OG card, HAND-COMPOSED from the live brand assets instead of the old
// pre-baked logo-light.png: the wordmark set in Glacial Bold and the cube +
// droplet SVG paths (the same artwork Logo.tsx renders on-site, split the
// same way). Every color and size is a parameter — the production
// opengraph-image renders it at OG_DEFAULTS; /AB/OG/render feeds it query
// params for the gallery/playground.
//
// Satori lessons learned (verified against real renders):
// - Inline <svg> children get unreliable intrinsic sizing that can trigger
//   flex-shrink on the whole column (squished card, vanished droplet) — so
//   the artwork ships as data-URI <img> elements, satori's first-class path.
// - Percentage positions in radial-gradient() misparse (the old card's
//   "circle at 50% 20%" rendered as a corner blob in production too);
//   pixel positions parse correctly, so gx/gy/gr convert to px here.
// - Text needs lineHeight: 1 and flexShrink: 0 for predictable stacking.

// Artwork paths, verbatim from components/Logo.tsx.
const CUBE_VIEWBOX = "93.851 34.39 39.063 43.227";
const CUBE_RATIO = 39.063 / 43.227; // width per unit height
const CUBE_INK =
  "m113.384 34.89 2.044 1.039 16.987 8.817V66.05l-1.659 1.001-17.372 10.066L96.01 67.051l-1.659-1.001V44.746l16.987-8.817z";
const CUBE_BLUE =
  "M111.174 55.657v16.326a.217.217 0 0 1-.328.186l-13.222-7.84a.22.22 0 0 1-.107-.187V49.063c0-.163.171-.266.315-.195l13.223 6.594a.22.22 0 0 1 .119.195";
const CUBE_FACES =
  "M128.718 49.063v15.079c0 .077-.04.148-.105.187l-13.224 7.84a.216.216 0 0 1-.326-.186V55.657c0-.082.046-.159.12-.195l13.221-6.594a.217.217 0 0 1 .314.195m-2.281-3.038-13.266 6.532a.22.22 0 0 1-.192 0l-13.318-6.631a.217.217 0 0 1-.005-.388l13.136-6.799a.22.22 0 0 1 .199 0l13.45 6.899a.216.216 0 0 1-.004.387";
const DROP_VIEWBOX = "102 78.9 22.5 30.6";
const DROP_RATIO = 22.5 / 30.6;
const DROP_INK =
  "M119.18 89.727c-.949-1.756-2.025-3.746-3.389-5.899l-2.674-4.226s-6.921 11.71-7.317 12.406c-2.754 4.83-3.388 8.675-1.938 11.757a7.5 7.5 0 0 0 2.036 2.593c1.271 1.046 2.829 1.683 4.421 2.05 2.152.496 4.352.402 6.465-.229 1.484-.444 2.908-1.162 4.029-2.246a7.4 7.4 0 0 0 1.56-2.168c1.45-3.082.815-6.927-1.938-11.757-.397-.696-.813-1.466-1.255-2.281";
const DROP_BLUE =
  "M117.684 93.575c-1.271-2.229-2.631-4.995-4.566-8.055-1.937 3.06-3.296 5.826-4.567 8.055-3.898 6.836-2.717 10.857 3.135 11.881a8.4 8.4 0 0 0 2.864 0c5.851-1.024 7.033-5.045 3.134-11.881";

const hex = (c: string) => `#${c}`;

function svgUri(viewBox: string, paths: { d: string; fill: string }[]): string {
  const body = paths
    .map((p) => `<path fill="${p.fill}" d="${p.d}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function OgCard({ p }: { p: OgParams }) {
  const gxPx = Math.round((p.gx / 100) * OG_SIZE.width);
  const gyPx = Math.round((p.gy / 100) * OG_SIZE.height);
  const grPx = Math.round((p.gr / 100) * OG_SIZE.width * 0.75);

  const cubeSrc = svgUri(CUBE_VIEWBOX, [
    { d: CUBE_INK, fill: hex(p.ink) },
    { d: CUBE_BLUE, fill: hex(p.blue) },
    { d: CUBE_FACES, fill: hex(p.face) },
  ]);
  const dropSrc = svgUri(DROP_VIEWBOX, [
    { d: DROP_INK, fill: hex(p.ink) },
    { d: DROP_BLUE, fill: hex(p.drop) },
  ]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle ${grPx}px at ${gxPx}px ${gyPx}px, ${hex(p.bg1)} 0%, ${hex(p.bg2)} 100%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          fontFamily: "Glacial",
          fontSize: p.ws,
          lineHeight: 1,
          letterSpacing: Math.round(p.ws * 0.14),
          color: hex(p.word),
        }}
      >
        ICE FRAGRANCES
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cubeSrc}
        width={Math.round(p.cube * CUBE_RATIO)}
        height={p.cube}
        style={{ flexShrink: 0, marginTop: p.gap }}
        alt=""
      />
      {p.dh > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dropSrc}
          width={Math.round(p.dh * DROP_RATIO)}
          height={p.dh}
          style={{ flexShrink: 0 }}
          alt=""
        />
      ) : null}
      {p.tag ? (
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            fontFamily: "Glacial",
            fontSize: p.ts,
            lineHeight: 1,
            letterSpacing: Math.round(p.ts * 0.07),
            color: hex(p.tc),
            marginTop: p.gap,
          }}
        >
          {p.tag.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}
