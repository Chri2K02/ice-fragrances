import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Ice Fragrances",
  description: "How Ice Fragrances collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 min-h-[60vh] text-sm leading-relaxed">
      <h1 className="text-3xl font-semibold mb-2">Privacy Policy</h1>
      <p className="opacity-60 mb-8">Last updated: June 2026</p>

      <div className="space-y-6 opacity-90">
        <p>
          This Privacy Policy explains how Ice Fragrances (&quot;we&quot;,
          &quot;us&quot;) collects, uses, and shares information when you visit
          or make a purchase at icefragrances.com.
        </p>

        <section>
          <h2 className="font-semibold text-base mb-1">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Information you provide:</strong> your name and shipping
              address at checkout, and your email and account details if you
              create an account.
            </li>
            <li>
              <strong>Payment information:</strong> handled directly by our
              payment processor (Stripe). We never see or store your full card
              details.
            </li>
            <li>
              <strong>Automatically collected:</strong> device and usage data,
              and cookies/identifiers used for analytics and advertising.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and ship your orders and provide customer support.</li>
            <li>To manage your account and order history.</li>
            <li>To measure and improve our site and marketing.</li>
            <li>
              To deliver and measure advertising (for example, via the Meta
              Pixel).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">
            Service providers we share with
          </h2>
          <p>
            We share only the information needed with trusted providers who help
            us run the store:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>
              <strong>Stripe</strong> — payment processing and tax calculation.
            </li>
            <li>
              <strong>Clerk</strong> — account sign-in and management.
            </li>
            <li>
              <strong>Meta (Facebook/Instagram)</strong> — advertising and
              analytics via the Meta Pixel. With Advanced Matching, limited
              contact information may be shared in a hashed (irreversible) form
              to measure ads and build audiences.
            </li>
            <li>
              <strong>Vercel &amp; Neon</strong> — website hosting and database.
            </li>
            <li>
              <strong>Shipping carriers</strong> — to deliver your order.
            </li>
          </ul>
          <p className="mt-1">We do not sell your personal information.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Cookies &amp; advertising</h2>
          <p>
            We use cookies and similar technologies for essential site function,
            analytics, and advertising. You can control cookies through your
            browser settings, and you can manage ad personalization in your{" "}
            <a
              href="https://www.facebook.com/adpreferences"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Meta ad preferences
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Your choices</h2>
          <p>
            You can access or delete your account at any time, and you may
            contact us to request access to or deletion of your personal
            information.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-1">Contact</h2>
          <p>
            Questions? Email us at{" "}
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
