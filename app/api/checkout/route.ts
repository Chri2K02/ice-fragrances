import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buildLineItems } from "@/lib/checkout";
import { orderShippingCents, type Country } from "@/lib/shipping";
import type { CartItem } from "@/lib/cartStore";

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
    const body = (await req.json()) as { items: CartItem[]; address: unknown };
    const lineItems = buildLineItems(body.items);
    const address = validateAddress(body.address);
    const shipping = orderShippingCents(body.items, address.country, address.state);

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const stripeAddress = {
      line1: address.line1,
      city: address.city,
      state: address.state,
      postal_code: address.postal,
      country: address.country,
    };

    // Pre-set the customer's address so automatic tax uses it (no double entry).
    const customer = await stripe.customers.create({
      name: address.name,
      address: stripeAddress,
      shipping: { name: address.name, address: stripeAddress },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      line_items: lineItems,
      automatic_tax: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shipping, currency: "usd" },
            display_name: shipping === 0 ? "Free shipping" : "Shipping",
            tax_behavior: "exclusive",
          },
        },
      ],
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
