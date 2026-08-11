import { useSyncExternalStore } from "react";

// Shared control idioms so the header's pill buttons (cart, currency, theme)
// stay visually identical — one place to tune shape and hover feedback.
export const PILL_BUTTON =
  "rounded-full border px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10";

const emptySubscribe = () => () => {};

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
