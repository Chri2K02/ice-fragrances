import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/auth-schema";
import { sendEmail, otpEmailHtml } from "@/lib/email";

// Better Auth, stood up ALONGSIDE Clerk (additive, nothing consumes it yet).
// Single-tenant subset of zcanon: NO organization/admin/PAT/relay plugins, no
// cross-subdomain cookies — this site is a single host.
const isProd = process.env.NODE_ENV === "production";

// Lazy DB handle: getDb() calls neon(DATABASE_URL!) which THROWS when the URL
// is unset. Reuse the existing instance (lib/db) but defer that call to the
// first actual auth query — so module evaluation during `next build` (page-
// data collection, preview deploys without the prod DB var) never throws.
// Keeps this lane non-breaking: the build doesn't gain a DATABASE_URL
// requirement the rest of the app doesn't already have at request time.
let _db: ReturnType<typeof getDb> | null = null;
const lazyDb = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop, receiver) {
    if (!_db) _db = getDb();
    const value = Reflect.get(_db as object, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});

export const auth = betterAuth({
  // Reuse the existing Neon Drizzle instance (lib/db), lazily (see above).
  database: drizzleAdapter(lazyDb, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET,

  // Port-agnostic baseURL: derive the origin from the inbound request host when
  // it matches an allowed pattern, so local dev works on any port (Google
  // special-cases localhost, so the OAuth redirect_uri tracks whatever port
  // you're on instead of hardcoding :3000). `fallback`/`protocol` only matter
  // for host-less SSR edge cases. See zcanon auth.md §Port-Agnostic baseURL.
  baseURL: {
    allowedHosts: [
      "localhost:*",
      "127.0.0.1:*",
      "www.icefragrances.com",
      "icefragrances.com",
    ],
    fallback:
      process.env.BETTER_AUTH_URL ||
      (isProd ? "https://www.icefragrances.com" : "http://localhost:3000"),
    protocol: isProd ? "https" : "auto",
  },

  emailAndPassword: {
    enabled: true,
    // Keep this TRUE — it's the invariant that makes the credential↔google
    // accountLinking below safe (verified-on-both-sides). See auth.md gotcha.
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      // NOTE the GOOGLE_OAUTH_* names — the operator set these in Vercel
      // (NOT zcanon's GOOGLE_CLIENT_*).
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      // Safe ONLY because requireEmailVerification is true above — if that is
      // ever disabled, remove "credential" or an attacker who registers a
      // password account with a victim's email could hijack their Google link.
      trustedProviders: ["google", "credential"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },

  // Single host — simple static list (skip zcanon's private-IP/relay machinery).
  trustedOrigins: [
    "https://www.icefragrances.com",
    "https://icefragrances.com",
    "http://localhost:3000",
  ],

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          to: email,
          subject: "Your Ice Fragrances verification code",
          html: otpEmailHtml(otp),
        });
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
    }),
  ],

  // Database-backed so limits hold across serverless instances on Vercel.
  rateLimit: {
    window: 60,
    max: 30,
    storage: "database",
  },
});
