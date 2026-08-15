import { glacial } from "@/lib/fonts";

// The lockup as live markup instead of theme-swapped PNGs: "Ice Fragrances"
// set in Glacial Indifference Bold (the same face the old PNG had baked in)
// over the cube+drop mark inlined as SVG. The mark's black/white swap per
// theme via dark: fills (blues stay constant) and the text inherits the
// theme color — no image swap, no mounted-state dance, no drop-shadow hack,
// crisp at every size. PNG logos remain only for OG images and JSON-LD.
//
// The lockup is split into three SCROLL-COLLAPSIBLE pieces (wordmark, cube,
// teardrop) so the header can shrink to just the cube on scroll: the
// .hdr-* wrappers collapse and transform driven by the --hdr-p custom
// property the header sets while scrolling (see globals.css). Anywhere the
// var is absent (404 page, header at rest) everything renders at full size —
// the pieces' viewBoxes carve up the original artwork's coordinate space, so
// at --hdr-p: 0 the lockup is pixel-equivalent to the old single SVG.
const INK = "fill-[#100f0d] dark:fill-white";
const FACE = "fill-white dark:fill-[#100f0d]";

export function Logo() {
  return (
    <span className="logo-lockup flex flex-col items-center">
      {/* Font size comes from --word-size via .hdr-word-wrap, so the
          collapse math (1em) and the flow spacer share one source. */}
      <span
        className={`${glacial.className} hdr-word-wrap uppercase font-bold leading-none tracking-[0.14em]`}
      >
        <span className="hdr-word whitespace-nowrap">Ice Fragrances</span>
      </span>

      {/* Cube — the piece that SURVIVES the scroll collapse. viewBox carries
          0.5u padding beyond the artwork's exact bounds — the export was
          edge-tight and antialiasing clipped the edges. */}
      <svg
        viewBox="93.851 34.39 39.063 43.227"
        className="w-auto"
        style={{ height: "var(--cube-h, 43.9px)" }}
        aria-hidden="true"
      >
        <defs>
          {/* Diagonal glint band that sweeps the mark then rests. The color
              contrasts the outline it rides: white over the black outline in
              light mode, black over the white outline in dark mode (the
              --logo-shimmer var flips with the theme). SMIL, so it needs no
              JS; the overlay is hidden under prefers-reduced-motion. */}
          <linearGradient
            id="logo-shimmer"
            gradientUnits="userSpaceOnUse"
            x1="93.851"
            y1="40"
            x2="132.914"
            y2="66"
          >
            <stop
              offset="0.35"
              style={{ stopColor: "var(--logo-shimmer)" }}
              stopOpacity="0"
            />
            <stop
              offset="0.5"
              style={{ stopColor: "var(--logo-shimmer)" }}
              stopOpacity="0.6"
            />
            <stop
              offset="0.65"
              style={{ stopColor: "var(--logo-shimmer)" }}
              stopOpacity="0"
            />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="-55 0; 55 0; 55 0"
              keyTimes="0; 0.4; 1"
              dur="5.5s"
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
        <path
          className={INK}
          d="m113.384 34.89 2.044 1.039 16.987 8.817V66.05l-1.659 1.001-17.372 10.066L96.01 67.051l-1.659-1.001V44.746l16.987-8.817z"
        />
        <path
          fill="#66a4de"
          d="M111.174 55.657v16.326a.217.217 0 0 1-.328.186l-13.222-7.84a.22.22 0 0 1-.107-.187V49.063c0-.163.171-.266.315-.195l13.223 6.594a.22.22 0 0 1 .119.195"
        />
        <path
          className={FACE}
          d="M128.718 49.063v15.079c0 .077-.04.148-.105.187l-13.224 7.84a.216.216 0 0 1-.326-.186V55.657c0-.082.046-.159.12-.195l13.221-6.594a.217.217 0 0 1 .314.195m-2.281-3.038-13.266 6.532a.22.22 0 0 1-.192 0l-13.318-6.631a.217.217 0 0 1-.005-.388l13.136-6.799a.22.22 0 0 1 .199 0l13.45 6.899a.216.216 0 0 1-.004.387"
        />
        {/* Shimmer overlay: the outline path again, filled with the sweeping
            gradient so the glint stays clipped to the ink. */}
        <g className="logo-shimmer" fill="url(#logo-shimmer)">
          <path d="m113.384 34.89 2.044 1.039 16.987 8.817V66.05l-1.659 1.001-17.372 10.066L96.01 67.051l-1.659-1.001V44.746l16.987-8.817z" />
        </g>
      </svg>

      {/* Teardrop — shrinks to nothing on scroll, returns at the top. */}
      <span className="hdr-drop-wrap">
        <svg
          viewBox="102 78.9 22.5 30.6"
          className="hdr-drop w-auto"
          style={{ height: "var(--drop-h, 31.1px)" }}
          aria-hidden="true"
        >
          <defs>
            {/* Same glint band as the cube's, in the same user coordinate
                space and on the same clock, so the sweep reads as one pass
                over the whole mark. */}
            <linearGradient
              id="logo-shimmer-drop"
              gradientUnits="userSpaceOnUse"
              x1="93.851"
              y1="40"
              x2="132.914"
              y2="66"
            >
              <stop
                offset="0.35"
                style={{ stopColor: "var(--logo-shimmer)" }}
                stopOpacity="0"
              />
              <stop
                offset="0.5"
                style={{ stopColor: "var(--logo-shimmer)" }}
                stopOpacity="0.6"
              />
              <stop
                offset="0.65"
                style={{ stopColor: "var(--logo-shimmer)" }}
                stopOpacity="0"
              />
              <animateTransform
                attributeName="gradientTransform"
                type="translate"
                values="-55 0; 55 0; 55 0"
                keyTimes="0; 0.4; 1"
                dur="5.5s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          <path
            className={INK}
            d="M119.18 89.727c-.949-1.756-2.025-3.746-3.389-5.899l-2.674-4.226s-6.921 11.71-7.317 12.406c-2.754 4.83-3.388 8.675-1.938 11.757a7.5 7.5 0 0 0 2.036 2.593c1.271 1.046 2.829 1.683 4.421 2.05 2.152.496 4.352.402 6.465-.229 1.484-.444 2.908-1.162 4.029-2.246a7.4 7.4 0 0 0 1.56-2.168c1.45-3.082.815-6.927-1.938-11.757-.397-.696-.813-1.466-1.255-2.281"
          />
          <path
            fill="#54c4f2"
            d="M117.684 93.575c-1.271-2.229-2.631-4.995-4.566-8.055-1.937 3.06-3.296 5.826-4.567 8.055-3.898 6.836-2.717 10.857 3.135 11.881a8.4 8.4 0 0 0 2.864 0c5.851-1.024 7.033-5.045 3.134-11.881"
          />
          <g className="logo-shimmer" fill="url(#logo-shimmer-drop)">
            <path d="M119.18 89.727c-.949-1.756-2.025-3.746-3.389-5.899l-2.674-4.226s-6.921 11.71-7.317 12.406c-2.754 4.83-3.388 8.675-1.938 11.757a7.5 7.5 0 0 0 2.036 2.593c1.271 1.046 2.829 1.683 4.421 2.05 2.152.496 4.352.402 6.465-.229 1.484-.444 2.908-1.162 4.029-2.246a7.4 7.4 0 0 0 1.56-2.168c1.45-3.082.815-6.927-1.938-11.757-.397-.696-.813-1.466-1.255-2.281" />
          </g>
        </svg>
      </span>
    </span>
  );
}
