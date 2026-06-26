import Link from "next/link";
import { Logo } from "@/components/Logo";
import { glacial } from "@/lib/fonts";

// Branded 404. Next renders this for unmatched routes and any notFound()
// (e.g. our dynamicParams:false product slugs). It's noindex by default and
// prerenders statically (○ /_not-found in the route table). Layout mirrors
// app/success/page.tsx — centered min-h-screen grid + accent CTA button.
export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-6">
        <Logo />
        <div>
          <h1 className={`${glacial.className} text-4xl font-semibold`}>
            Lost in the frost
          </h1>
          <p className="mt-3 opacity-70">
            The page you&apos;re looking for drifted away.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block rounded-full px-6 py-3 font-medium text-black"
          style={{ background: "var(--accent)" }}
        >
          Back to store
        </Link>
      </div>
    </main>
  );
}
