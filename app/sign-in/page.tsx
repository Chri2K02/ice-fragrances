import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="grid place-items-center px-4 py-16 min-h-[70vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold mb-6 text-center">Sign in</h1>
        <AuthForm mode="signin" />
      </div>
    </main>
  );
}
