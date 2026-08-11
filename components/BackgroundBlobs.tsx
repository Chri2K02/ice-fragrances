"use client";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/ui";

// Ambient depth layer behind every page: three blurred gradient blobs drift
// on slow CSS keyframe loops, and a fourth trails the cursor via a lerped
// rAF loop (transform-only, no React state per frame — the loop parks itself
// when it catches up to the pointer). Colors ride --blob-* theme vars: faint
// blues/grays in light mode, near-black blues in dark. The layer is
// pointer-events-none and aria-hidden; the cursor blob only activates on
// fine-pointer devices, and reduced-motion stills everything (drift via CSS,
// the cursor loop here).
export function BackgroundBlobs() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia?.("(pointer: fine)")?.matches) return;
    const el = cursorRef.current;
    if (!el) return;
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let x = tx;
    let y = ty;
    const place = () => {
      // The blob div is 620px square; offset so the pointer sits at its center.
      el.style.transform = `translate3d(${x - 310}px, ${y - 310}px, 0)`;
    };
    const tick = () => {
      x += (tx - x) * 0.055;
      y += (ty - y) * 0.055;
      place();
      raf =
        Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5
          ? requestAnimationFrame(tick)
          : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    place();
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="bg-blob bg-blob-drift-a" />
      <div className="bg-blob bg-blob-drift-b" />
      <div className="bg-blob bg-blob-drift-c" />
      <div ref={cursorRef} className="bg-blob bg-blob-cursor" />
    </div>
  );
}
