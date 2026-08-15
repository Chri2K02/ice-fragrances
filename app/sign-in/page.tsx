import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { safeCallbackURL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  // Where to land after auth — e.g. the admin subdomain, which forces login
  // through this canonical page (see proxy.ts). Whitelisted to our own origins.
  const callbackURL = safeCallbackURL((await searchParams).callbackURL);

  return (
    <main className="grid place-items-center px-4 py-16 min-h-[70vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold mb-6 text-center">Sign in</h1>
        <AuthForm mode="signin" callbackURL={callbackURL} />
      </div>
    </main>
  );
}
