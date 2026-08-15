// The Stripe dashboard's own sections, in side-nav order.
//
// EXTENSION POINT: adding a section is two steps — an entry here, and a page at
// app/admin/stripe/<slug>/page.tsx. The side nav, active state, and the "not
// built yet" placeholder all read from this list, so nothing else needs
// touching. `built: false` keeps a planned section visible (and honest) in the
// nav without shipping a broken link.
export type StripeSection = {
  slug: string; // "" is the section root (/admin/stripe)
  label: string;
  description: string;
  built: boolean;
};

export const STRIPE_SECTIONS: StripeSection[] = [
  {
    slug: "",
    label: "Overview",
    description: "Account status, balance, and which mode you're looking at.",
    built: true,
  },
  {
    slug: "payments",
    label: "Payments",
    description: "Recent payments, their status, and what they were for.",
    built: true,
  },
  {
    slug: "payouts",
    label: "Payouts",
    description: "Transfers from your Stripe balance to your bank.",
    built: false,
  },
  {
    slug: "disputes",
    label: "Disputes",
    description: "Chargebacks needing evidence, and their deadlines.",
    built: false,
  },
  {
    slug: "customers",
    label: "Customers",
    description: "Stripe customer records and their saved payment methods.",
    built: false,
  },
  {
    slug: "webhooks",
    label: "Webhooks",
    description: "Endpoint health and recent delivery attempts.",
    built: false,
  },
];

export const stripeSectionHref = (slug: string) =>
  slug ? `/admin/stripe/${slug}` : "/admin/stripe";

export const findStripeSection = (slug: string) =>
  STRIPE_SECTIONS.find((s) => s.slug === slug);
