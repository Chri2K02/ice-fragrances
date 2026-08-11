"use client";
import { useTheme } from "next-themes";
import { PILL_BUTTON, useMounted } from "@/lib/ui";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  // theme-fade forces ONE transition timing on everything while the swap
  // plays out (see globals.css) — without it, elements with their own
  // transition utilities re-color at different speeds and the page shimmers.
  const toggle = () => {
    const root = document.documentElement;
    root.classList.add("theme-fade");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => root.classList.remove("theme-fade"), 320);
  };
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={toggle}
      className={PILL_BUTTON}
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? " Light" : " Dark"}</span>
    </button>
  );
}
