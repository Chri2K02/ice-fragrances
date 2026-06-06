"use client";
import { useEffect } from "react";

// Start at the top on page load/refresh instead of restoring the old scroll
// position. Skips when there's a hash (so #products anchor still works).
export function ScrollTop() {
  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);
  return null;
}
