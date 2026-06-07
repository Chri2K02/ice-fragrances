"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap"
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? " Light" : " Dark"}</span>
    </button>
  );
}
