/* Pre-paint boot. Loaded as a BLOCKING <script src> from the root layout's
 * <head>, so it runs before the first paint — the zcanon Layer-1 pattern.
 *
 * A static file rather than an inline script on purpose: React 19 warns about
 * inline executable scripts reconciled by the tree (it may move, dedupe or skip
 * them), and `next/script` with beforeInteractive runs AFTER hydration starts,
 * which is exactly too late to prevent a flash.
 *
 * It writes ONLY attributes on <html>. CSS then picks between variants that are
 * already in the server-rendered markup, so the correct one is painted first —
 * no waiting for React, and no hydration mismatch, because the server and the
 * client render the same markup either way.
 *
 * next-themes ships its own blocking script for the dark class; this handles
 * the state it doesn't know about. */
(function () {
  var el = document.documentElement;

  // Marks that JS is running, BEFORE first paint. Scroll-reveal animations
  // start from opacity:0, which would hide content forever if scripts were
  // blocked or slow — so that initial state is scoped to html.js. No JS, no
  // hiding: the page renders plainly instead of not at all.
  el.classList.add("js");

  // Display currency, persisted by the header toggle (zustand `persist`, so the
  // payload is { state: { currency } }). Absent/CAD is the default and needs no
  // attribute — only USD is marked.
  try {
    var raw = localStorage.getItem("icefrag-currency");
    if (raw && JSON.parse(raw).state.currency === "USD") {
      el.setAttribute("data-currency", "USD");
    }
  } catch (e) {
    /* private mode, corrupt value — the CAD default already applies */
  }
})();
