import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold">Thank you ❄️</h1>
        <p className="mt-3 opacity-70">
          Your order is confirmed. A receipt is on its way to your email.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-full px-6 py-3 font-medium text-black"
          style={{ background: "var(--accent)" }}
        >
          Back to store
        </Link>
      </div>
    </main>
  );
}
