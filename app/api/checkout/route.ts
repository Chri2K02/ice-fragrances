import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { buildLineItems, tariffLineItem } from "@/lib/checkout";
import {
  cartNeedsShipping,
  shippingRateCents,
  type Country,
} from "@/lib/shipping";
import type { CartItem } from "@/lib/cartStore";
import { type Currency, convertCents, stripeCurrency } from "@/lib/currency";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { getProduct } from "@/lib/products";

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

function validateCountry(c: unknown): Country {
  if (c === "US" || c === "CA") return c;
  throw new Error("Please choose a shipping destination (US or Canada).");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      items: CartItem[];
      address?: unknown;
      country?: unknown;
      currency?: string;
      fbp?: string;
      fbc?: string;
    };

    // Determine the authoritative shipping destination, then derive currency
    // and the US import tariff from THAT — never from a client-controlled
    // currency toggle. Apparel carts collect a full address on-site; cologne
    // carts collect only the country here and let Stripe collect the address
    // (locked to this country below). This is what makes US orders always pay
    // the tariff: there's no way to ship to the US without selecting "US".
    const cartNeeds = cartNeedsShipping(body.items);
    const address = cartNeeds ? validateAddress(body.address) : null;
    // Stale clients (mid-session on old JS right after a deploy) don't send a
    // country — fall back to their currency so their checkout never hard-fails;
    // a fresh load gets the enforced country selector.
    const country: Country = address
      ? address.country
      : body.country === "US" || body.country === "CA"
        ? body.country
        : validateCountry(body.currency === "USD" ? "US" : "CA");
    const currency: Currency = country === "US" ? "USD" : "CAD";
    const cur = stripeCurrency(currency);

    const lineItems = buildLineItems(body.items, currency);

    // US destinations pay a flat import tariff (currency now follows country, so
    // this is gated on the real destination, not a toggle).
    const tariff = tariffLineItem(currency);
    if (tariff) lineItems.push(tariff);

    // Reject if any tracked variant is sold out / short on stock.
    const db = getDb();
    for (const item of body.items) {
      const rows = await db
        .select({ stock: inventory.stock })
        .from(inventory)
        .where(
          and(
            eq(inventory.productId, item.id),
            eq(inventory.size, item.size ?? "")
          )
        );
      if (rows.length && rows[0].stock < item.qty) {
        const p = getProduct(item.id);
        throw new Error(
          `${p?.name ?? item.id}${item.size ? ` (${item.size})` : ""} is sold out`
        );
      }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    // Embedded Checkout renders on our own /checkout page (no redirect to
    // checkout.stripe.com). After payment, Stripe redirects the top window to
    // this return_url. /success retrieves the session by id for the receipt +
    // Purchase pixel. Embedded sessions take a single return_url (no cancel_url).
    const embedded = {
      ui_mode: "embedded_page" as const,
      return_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    };

    // Attach the cart + signed-in user so the webhook can record the order.
    const { userId } = await auth();
    const metadata = {
      items: JSON.stringify(body.items),
      userId: userId ?? "",
      fbp: body.fbp ?? "",
      fbc: body.fbc ?? "",
    };

    let session: Stripe.Checkout.Session;

    if (address) {
      // Apparel/accessories: address collected on our site -> compute zone rate.
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
        ...embedded,
      });
    } else {
      // All colognes: free shipping. Stripe collects the address, but locked to
      // the chosen destination so the tariff (or lack of it) can't be dodged.
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        metadata,
        automatic_tax: { enabled: true },
        shipping_address_collection: { allowed_countries: [country] },
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
        ...embedded,
      });
    }

    return NextResponse.json({ client_secret: session.client_secret });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
