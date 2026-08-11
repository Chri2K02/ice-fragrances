import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main className="max-w-sm mx-auto px-4 py-16 min-h-[70vh]">
      <h1 className="text-2xl font-semibold mb-2">Reset your password</h1>
      <p className="opacity-70 text-sm mb-6">
        Enter your email and we&apos;ll send a 6-digit code to set a new
        password.
      </p>
      <ResetPasswordForm />
    </main>
  );
}
