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
      // Slight negative bottom margin so it fires just after the element starts
      // entering, not the instant its first pixel appears.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
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
