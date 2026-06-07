import Link from "next/link";
import Stripe from "stripe";
import { PurchaseTracker } from "@/components/PurchaseTracker";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let purchase: { value: number; currency: string } | null = null;
  if (session_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.retrieve(session_id);
      purchase = {
        value: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "cad").toUpperCase(),
      };
    } catch {
      /* ignore — still show the thank-you */
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Thank you ❄️</h1>
        <p className="mt-3 opacity-70">
          Your order is confirmed. A receipt is on its way to your email.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-full px-6 py-3 font-medium text-black"
          style={{ background: "var(--accent)" }}
        >
          Back to store
        </Link>
      </div>
      {purchase && (
        <PurchaseTracker value={purchase.value} currency={purchase.currency} />
      )}
    </main>
  );
}
