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


  // Header scroll-collapse. Header.tsx computes this in a React EFFECT, so a
  // page loaded already scrolled (refresh mid-page, back-navigation restoring
  // scroll) painted the full lockup and then snapped collapsed once hydration
  // ran. Setting it here — on <html>, which the header inherits from until it
  // sets its own — makes the first paint correct.
  //
  // scrollY is still 0 while <head> parses, so the listeners below carry it
  // through scroll restoration, which lands well before hydration.
  // COLLAPSE_RANGE is mirrored from components/Header.tsx — keep them equal.
  var COLLAPSE_RANGE = 140;
  var applyHeader = function () {
    var p = Math.min(1, Math.max(0, (window.scrollY || 0) / COLLAPSE_RANGE));
    el.style.setProperty("--hdr-p", p.toFixed(4));
  };
  applyHeader();

  // Poll per frame rather than listening for `scroll`: the two ways a page
  // arrives already scrolled — session scroll restoration and an in-page
  // #anchor jump — don't reliably dispatch a scroll event, so a listener alone
  // missed exactly the cases this exists for. Polling reads scrollY whatever
  // moved it.
  //
  // It stops the moment React sets --hdr-p on the <header> itself (that value
  // wins over this inherited one, so the two never fight), with a hard cap in
  // case hydration never happens.
  var frames = 0;
  var poll = function () {
    var header = document.querySelector("header");
    if (header && header.style.getPropertyValue("--hdr-p")) return;
    if (frames++ > 600) return; // ~10s ceiling
    applyHeader();
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);
})();
