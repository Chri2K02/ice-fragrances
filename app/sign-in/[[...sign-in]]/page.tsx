import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="grid place-items-center px-4 py-16 min-h-[70vh]">
      <SignIn />
    </main>
  );
}
