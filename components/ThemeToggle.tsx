"use client";
import { useTheme } from "next-themes";
import { PILL_BUTTON, useMounted } from "@/lib/ui";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={PILL_BUTTON}
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? " Light" : " Dark"}</span>
    </button>
  );
}
