import "server-only";
import type Stripe from "stripe";
import { resolveStripeMode, stripeFor, type StripeMode } from "@/lib/stripeMode";

// Read-only Stripe queries for the admin dashboard.
//
// Every read follows the viewer's CURRENT mode (lib/stripeMode): an admin in
// test mode sees test data, everyone else sees live. That keeps the dashboard
// honest about which world it's showing, and means test purchases can be
// inspected without touching live figures.
//
// EXTENSION POINT: new sections should add a loader here rather than calling
// Stripe from a page — one place owns mode resolution and failure handling, so
// a Stripe outage degrades to an empty section instead of a 500.

export type StripeLoad<T> = {
  mode: StripeMode;
  data: T | null;
  error: string | null;
};

async function load<T>(fn: (stripe: Stripe) => Promise<T>): Promise<StripeLoad<T>> {
  const mode = await resolveStripeMode();
  try {
    return { mode, data: await fn(stripeFor(mode)), error: null };
  } catch (e) {
    // Never surface raw Stripe errors to the browser — they can carry request
    // ids and key hints. The admin gets a short, actionable line instead.
    const message =
      e instanceof Error && /api key|authentication/i.test(e.message)
        ? "Stripe rejected the API key for this mode."
        : "Couldn't reach Stripe.";
    return { mode, data: null, error: message };
  }
}

export type StripeOverview = {
  accountName: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  available: { amount: number; currency: string }[];
  pending: { amount: number; currency: string }[];
};

export function getStripeOverview(): Promise<StripeLoad<StripeOverview>> {
  return load(async (stripe) => {
    // retrieveCurrent() is the account the key itself belongs to (the SDK's
    // accounts.retrieve() wants an explicit id or null).
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieveCurrent(),
      stripe.balance.retrieve(),
    ]);
    return {
      accountName:
        account.settings?.dashboard?.display_name ?? account.business_profile?.name ?? null,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      available: balance.available.map((b) => ({
        amount: b.amount,
        currency: b.currency.toUpperCase(),
      })),
      pending: balance.pending.map((b) => ({
        amount: b.amount,
        currency: b.currency.toUpperCase(),
      })),
    };
  });
}

export type StripePayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  email: string | null;
  description: string | null;
  refunded: boolean;
};

export function getStripePayments(limit = 25): Promise<StripeLoad<StripePayment[]>> {
  return load(async (stripe) => {
    const res = await stripe.paymentIntents.list({ limit });
    return res.data.map((pi) => ({
      id: pi.id,
      amount: pi.amount_received || pi.amount,
      currency: pi.currency.toUpperCase(),
      status: pi.status,
      created: pi.created,
      email: pi.receipt_email ?? null,
      description: pi.description ?? null,
      // `latest_charge` is an id unless expanded, so treat any refunded amount
      // on the intent as the signal.
      refunded: (pi as unknown as { amount_refunded?: number }).amount_refunded
        ? true
        : false,
    }));
  });
}
