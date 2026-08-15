import { useSyncExternalStore } from "react";

// Shared control idioms so the header's pill buttons (cart, currency, theme)
// stay visually identical — one place to tune shape and hover feedback.
// Borderless ghost style: outlines clashed with the text-link nav, so the
// pills read as quiet text until hovered, like the More menu's items.
export const PILL_BUTTON =
  "rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10";

const emptySubscribe = () => () => {};

/**
 * Reads a value that only exists in the browser (window.location, …) without a
 * setState-in-effect dance: `serverValue` is used for SSR and the first
 * hydration render, then `get` takes over. `get` must return a primitive —
 * useSyncExternalStore compares snapshots by identity.
 */
export function useBrowserValue<T extends string | number | boolean>(
  get: () => T,
  serverValue: T
): T {
  return useSyncExternalStore(emptySubscribe, get, () => serverValue);
}

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
