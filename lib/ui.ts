import { useSyncExternalStore } from "react";

// Shared control idioms so the header's pill buttons (cart, currency, theme)
// stay visually identical — one place to tune shape and hover feedback.
export const PILL_BUTTON =
  "rounded-full border px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10";

const emptySubscribe = () => () => {};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Live prefers-reduced-motion flag without a setState-in-effect. Guarded
// matchMedia access keeps it safe under jsdom (tests don't implement it);
// the server snapshot is false.
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia?.(REDUCED_MOTION_QUERY);
      mq?.addEventListener?.("change", onChange);
      return () => mq?.removeEventListener?.("change", onChange);
    },
    () => window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false,
    () => false
  );
}

// Hydration guard without a setState-in-effect: the server snapshot is false,
// the client snapshot true, so it flips exactly once at hydration — same
// behavior as the mounted-state effect dance, minus the extra render pass.
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
