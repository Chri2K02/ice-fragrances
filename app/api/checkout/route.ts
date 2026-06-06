import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { buildLineItems } from "@/lib/checkout";
import {
  cartNeedsShipping,
  shippingRateCents,
  type Country,
} from "@/lib/shipping";
import type { CartItem } from "@/lib/cartStore";
import { type Currency, convertCents, stripeCurrency } from "@/lib/currency";

type Address = {
  name: string;
  country: Country;
  state: string;
  line1: string;
  city: string;
  postal: string;
};

function validateAddress(a: unknown): Address {
  const x = a as Partial<Address> | undefined;
  if (!x) throw new Error("Missing address");
  if (x.country !== "US" && x.country !== "CA") {
    throw new Error("We ship to the US and Canada only");
  }
  for (const f of ["name", "state", "line1", "city", "postal"] as const) {
    if (!x[f] || typeof x[f] !== "string" || !x[f]!.trim()) {
      throw new Error(`Missing ${f}`);
    }
  }
  return {
    name: x.name!.trim(),
    country: x.country,
    state: x.state!.trim().toUpperCase(),
    line1: x.line1!.trim(),
    city: x.city!.trim(),
    postal: x.postal!.trim(),
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      items: CartItem[];
      address?: unknown;
      currency?: string;
    };
    const currency: Currency = body.currency === "CAD" ? "CAD" : "USD";
    const cur = stripeCurrency(currency);
    const lineItems = buildLineItems(body.items, currency);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const urls = {
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/`,
    };

    // Attach the cart + signed-in user so the webhook can record the order.
    const { userId } = await auth();
    const metadata = {
      items: JSON.stringify(body.items),
      userId: userId ?? "",
    };

    let session: Stripe.Checkout.Session;

    if (cartNeedsShipping(body.items)) {
      // Apparel/accessories: address collected on our site -> compute zone rate.
      const address = validateAddress(body.address);
      const shipping = shippingRateCents(address.country, address.state);
      const stripeAddress = {
        line1: address.line1,
        city: address.city,
        state: address.state,
        postal_code: address.postal,
        country: address.country,
      };
      const customer = await stripe.customers.create({
        name: address.name,
        address: stripeAddress,
        shipping: { name: address.name, address: stripeAddress },
      });
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customer.id,
        line_items: lineItems,
        metadata,
        automatic_tax: { enabled: true },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: convertCents(shipping, currency), currency: cur },
              display_name: "Shipping",
              tax_behavior: "exclusive",
            },
          },
        ],
        ...urls,
      });
    } else {
      // All colognes: free shipping, let Stripe collect the address.
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        metadata,
        automatic_tax: { enabled: true },
        shipping_address_collection: { allowed_countries: ["US", "CA"] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: cur },
              display_name: "Free shipping",
              tax_behavior: "exclusive",
            },
          },
        ],
        ...urls,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
