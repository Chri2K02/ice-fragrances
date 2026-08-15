"use client";
import { useEffect } from "react";
import { useToast } from "@/lib/toastStore";
import { useStripeMode } from "@/lib/stripeModeStore";

// The visible half of admin-only Stripe test mode (authority lives in
// lib/stripeMode; shared client state in lib/stripeModeStore). On every page
// load it:
//
//   1. reads `?stripeMode=` straight off window.location — NOT useSearchParams,
//      which would deopt every statically-rendered page to client rendering
//      from the root layout;
//   2. hands the value to /api/stripe-mode, which verifies admin server-side;
//   3. strips the param from the URL with replaceState, so it vanishes for
//      non-admins and for `live` exactly as it does for admins — the bar
//      never keeps a trace either way;
//   4. shows a persistent badge while test mode is on, with one-click exit.
//      (The header's More menu offers the same toggle.)
//
// A non-admin sees nothing at any point: no badge, no error, no hint that the
// parameter means anything.
export function StripeModeBadge() {
  const mode = useStripeMode((s) => s.mode);
  const refresh = useStripeMode((s) => s.refresh);
  const apply = useStripeMode((s) => s.apply);
  const toast = useToast((s) => s.show);

  useEffect(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("stripeMode");

    // Clean the URL first so the param is transient regardless of outcome.
    if (param !== null) {
      url.searchParams.delete("stripeMode");
      window.history.replaceState(
        null,
        "",
        url.pathname + (url.search || "") + url.hash
      );
    }

    if (param === null) {
      void refresh();
      return;
    }
    void apply(param === "test" ? "test" : "live").then((r) => {
      // Only ever speak up for someone who asked for test and is entitled to
      // an answer — a non-admin's request resolves silently to live.
      if (param === "test" && r.reason) toast(r.reason);
      else if (r.mode === "test") toast("Stripe test mode on — no real charges.");
    });
  }, [refresh, apply, toast]);

  if (mode !== "test") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
      <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-black/70" />
      <span>Stripe test mode</span>
      <button
        type="button"
        onClick={() => {
          void apply("live").then(() => {
            toast("Back to live mode.");
            // Full reload so server components re-render against the cleared
            // cookie (the Stripe admin section reads mode server-side).
            window.location.reload();
          });
        }}
        aria-label="Exit Stripe test mode"
        className="ml-0.5 grid h-4 w-4 place-items-center rounded-full hover:bg-black/15"
      >
        <svg
          viewBox="0 0 24 24"
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
