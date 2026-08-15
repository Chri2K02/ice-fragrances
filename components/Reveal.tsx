"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Classic scroll reveal: fade up as an element enters the viewport, once.
//
// The hidden starting state lives in CSS scoped to html.js (set pre-paint by
// public/boot.js) and to prefers-reduced-motion: no-preference — so with JS
// blocked, or motion reduced, content simply renders in place rather than
// staying invisible. `index` staggers siblings by a fixed step.
//
// The reveal flips a DOM attribute rather than React state: it's a one-way
// visual flag, so there's nothing for React to own, and a grid of cards
// doesn't re-render just to become visible.
export function Reveal({
  children,
  index = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  /** Position among siblings — each step adds a small delay. */
  index?: number;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.setAttribute("data-shown", "");
    // No IntersectionObserver: show immediately rather than never.
    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show();
            io.disconnect();
          }
        }
      },
      // Shrink the root well up from the bottom so the reveal fires when the
      // element is genuinely being LOOKED at, not when its first pixel peeks
      // in. Product cards are tall: at a small threshold their top edge
      // intersects immediately and the animation finished before it was ever
      // on screen, which read as no animation at all. threshold 0 is right
      // once the root is shrunk — the margin, not the ratio, is the gate.
      { rootMargin: "0px 0px -18% 0px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal=""
      style={{ "--reveal-delay": `${index * 70}ms` } as React.CSSProperties}
      className={className}
    >
      {children}
    </Tag>
  );
}
