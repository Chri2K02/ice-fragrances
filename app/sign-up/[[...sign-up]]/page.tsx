import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="grid place-items-center px-4 py-16 min-h-[70vh]">
      <SignUp />
    </main>
  );
}
