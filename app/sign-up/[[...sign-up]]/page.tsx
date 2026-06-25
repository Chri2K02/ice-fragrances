import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <main className="grid place-items-center px-4 py-16 min-h-[70vh]">
      <SignUp />
    </main>
  );
}
