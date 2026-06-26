import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions for browsing and ordering from Ice Fragrances.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 min-h-[60vh] text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold mb-2">Terms of Service</h1>
      <p className="opacity-60 mb-8">Last updated: June 2026</p>

      <div className="space-y-6 opacity-90">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of icefragrances.com and any purchase you make from Ice Fragrances
          (&quot;we&quot;, &quot;us&quot;). By browsing the site or placing an
          order, you agree to these Terms. If you do not agree, please do not use
          the site.
        </p>

        <section>
          <h2 className="font-semibold text-base mb-1">Orders &amp; pricing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Prices are set in Canadian dollars (CAD). Amounts shown in USD are
              a converted estimate for convenience; the exact total is confirmed
              at checkout.
            </li>
            <li>
              For orders shipped to the United States, an import tariff is added
              and shown before payment.
            </li>
            <li>
              We may decline or cancel an order, or correct a price, in the event
              of an obvious error (for example, a mispriced item). If we cancel a
              paid order, we will refund it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Payment</h2>
          <p>
            Payments are processed by our payment provider, Stripe. We never see
            or store your full card details. Placing an order authorizes us to
            charge the confirmed total to your chosen payment method.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Shipping &amp; delivery</h2>
          <p>
            Shipping details, timelines, and conditions are described on our{" "}
            <Link href="/shipping" className="underline">
              Shipping page
            </Link>
            . In short: orders arrive within a maximum of 10 days, shipping is
            covered on our end, and any duties or import taxes are paid by the
            receiver. We do not ship with DHL.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">
            Returns &amp; damaged items
          </h2>
          <p>
            If your item arrives damaged, you are entitled to a replacement.
            Contact us with your order details and we will make it right. Because
            fragrances are personal-care products, we are unable to accept
            returns of opened items except where a replacement applies or as
            required by law.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Product use</h2>
          <p>
            Our fragrances have a high alcohol content. Spray on your own skin at
            your discretion, as alcohol can cause side effects for certain
            individuals. Keep products away from children and open flame.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Accounts</h2>
          <p>
            If you create an account, you are responsible for keeping your
            credentials secure and for activity that occurs under your account.
            Account sign-in is handled by Clerk. See our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>{" "}
            for how we handle your information.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Intellectual property</h2>
          <p>
            The Ice Fragrances name, logo, product names, text, and images on
            this site are our property and may not be copied or used without our
            permission.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">
            Limitation of liability
          </h2>
          <p>
            To the fullest extent permitted by law, Ice Fragrances is not liable
            for any indirect, incidental, or consequential damages arising from
            your use of the site or our products. Nothing in these Terms limits
            any rights you have that cannot be excluded under applicable law.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Governing law</h2>
          <p>
            These Terms are governed by the laws of Canada and the province in
            which we operate, without regard to conflict-of-law principles.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Changes take effect when
            posted to this page, and your continued use of the site means you
            accept the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a
              href="mailto:icefragrances@icefragrances.com"
              className="underline"
            >
              icefragrances@icefragrances.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
