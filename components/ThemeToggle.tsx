"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { PILL_BUTTON, useMounted } from "@/lib/ui";

// Three-way cycle: Light → Dark → Match Device → (repeat), after recanon's
// toggle. The icon and label reflect the CHOSEN mode (not the resolved one),
// so "Match Device" shows a monitor regardless of what the system resolves
// to. On change the label rides a horizontal accordion — it expands to
// announce the new mode, then collapses back to an icon-only pill.
const ORDER = ["light", "dark", "system"] as const;
type Mode = (typeof ORDER)[number];

const LABELS: Record<Mode, string> = {
  light: "Light",
  dark: "Dark",
  system: "Match Device",
};

// How long the label stays expanded after a change before collapsing.
const LABEL_HOLD_MS = 1800;

// Feather-style strokes, same icon language as the bag and Instagram icons.
function ModeIcon({ mode }: { mode: Mode }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 17,
    height: 17,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (mode === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
  }
  if (mode === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef(0);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  // The CHOSEN mode (light/dark/system) lives in localStorage and isn't known
  // until hydration — unlike the RESOLVED theme, which next-themes' own
  // blocking script applies pre-paint. So instead of rendering nothing (which
  // popped the pill in late and shifted the controls beside it), reserve the
  // exact footprint and let the icon fade in.
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`${PILL_BUTTON} inline-flex items-center invisible`}
      >
        <ModeIcon mode="system" />
      </span>
    );
  }

  const mode: Mode = ORDER.includes(theme as Mode) ? (theme as Mode) : "system";
  const label = LABELS[mode];

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    // theme-fade forces ONE transition timing on everything while the swap
    // plays out (see globals.css) — otherwise elements with their own
    // transition utilities re-color at different speeds and the page shimmers.
    const root = document.documentElement;
    root.classList.add("theme-fade");
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-fade"), 320);
    setExpanded(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setExpanded(false), LABEL_HOLD_MS);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${label}. Click to change.`}
      title={`Theme: ${label}`}
      className={`${PILL_BUTTON} inline-flex items-center`}
    >
      <ModeIcon mode={mode} />
      <span
        className={`inline-block overflow-hidden whitespace-nowrap transition-[max-width,margin-left,opacity] duration-300 ${
          expanded ? "max-w-32 ml-1.5 opacity-100" : "max-w-0 ml-0 opacity-0"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
