import { resolveStripeMode } from "@/lib/stripeMode";

// Says which world the Stripe section is showing. Everything under /admin/stripe
// follows the viewer's current mode, so this is load-bearing: without it, an
// admin in test mode could read an empty payments list as "no sales".
export async function StripeModeNotice() {
  const mode = await resolveStripeMode();
  return (
    <p className="text-sm opacity-70">
      {mode === "test" ? (
        <>
          Showing{" "}
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-black">
            TEST
          </span>{" "}
          data — you&apos;re in Stripe test mode. Exit via the badge to see live
          figures.
        </>
      ) : (
        <>
          Showing live data, read straight from Stripe. Stripe remains the record
          for payments; fulfilment lives under Orders.
        </>
      )}
    </p>
  );
}
