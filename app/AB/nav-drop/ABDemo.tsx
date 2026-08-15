"use client";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";
import { HeroVideo } from "@/components/HeroVideo";
import { glacialRegular } from "@/lib/fonts";

// Side-by-side A/B of the header's droplet collapse: A fades the drop in
// lockstep with the wordmark (current behavior), B only shrinks it (the
// previous behavior). ONE scroll position drives both — the page scroll
// writes --hdr-p onto the shared root, both columns' lockups inherit it, so
// any scroll offset shows the two variants in the exact same state.
//
// The real site header/footer are display:none'd for this route (style tag
// below): three stacked headers would muddy the comparison, and the site
// header's fixed bar would overlap the columns' sticky bars.

function DemoColumn({ label, nofade }: { label: string; nofade?: boolean }) {
  return (
    <div className={nofade ? "ab-nofade" : undefined}>
      {/* Constant-height sticky box (same height sum as the real header's
          flow spacer) — the bar inside shrinks visually against its top
          edge, mirroring the real fixed-header behavior per column. */}
      <div className="ab-sticky">
        <div
          className="backdrop-blur-md border-b border-black/10 dark:border-white/10"
          style={{ background: "color-mix(in srgb, var(--bg) 80%, transparent)" }}
        >
          <div
            className={`${glacialRegular.className} hdr-row px-4 relative flex items-center justify-center`}
          >
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest opacity-60">
              {label}
            </span>
            <Logo />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-60 hidden sm:block">
              Cart (0)
            </span>
          </div>
        </div>
      </div>
      <HeroVideo />
      {/* Room to scroll well past the collapse range. */}
      <div className="h-[120vh]" />
    </div>
  );
}

export function ABDemo() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Same progress math as the real header (COLLAPSE_RANGE = 140), written
  // once on the shared root per rAF frame — both columns inherit it.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, window.scrollY / 140));
      el.style.setProperty("--hdr-p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef}>
      <style>{`
        /* Hide the real site chrome on this comparison route. The demo's
           sticky boxes are divs, so plain element selectors only catch the
           site's <header>/<footer>; the site's flow spacer is the only
           .hdr-spacer here (the demo uses .ab-sticky instead). */
        header, footer, .hdr-spacer { display: none; }
        .ab-sticky {
          position: sticky;
          top: 0;
          z-index: 10;
          height: calc(2.5rem + var(--word-size) + var(--word-gap) + var(--cube-h) + var(--drop-h));
        }
        /* Variant B: shrink only — pin the drop's opacity back to 1. */
        .ab-nofade .hdr-drop { opacity: 1; }
      `}</style>
      <div className="grid grid-cols-2 divide-x divide-black/10 dark:divide-white/10">
        <DemoColumn label="A · fade with text" />
        <DemoColumn label="B · shrink only" nofade />
      </div>
    </div>
  );
}
