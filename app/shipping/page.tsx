import type { Metadata } from "next";
import { glacial, glacialRegular } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Shipping — Ice Fragrances",
  description: "Shipping information for Ice Fragrances.",
};

export default function ShippingPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1
        className={`${glacial.className} uppercase text-3xl font-semibold mb-10 text-center`}
      >
        Shipping
      </h1>
      <ul
        className={`${glacialRegular.className} space-y-5 text-base leading-relaxed`}
      >
        <li>Expect your order in a maximum of 10 days.</li>
        <li>If your item(s) are damaged, you&apos;re entitled to another.</li>
        <li>We DO NOT ship with DHL.</li>
        <li>
          Spray on your own skin at your discretion — high alcohol content can
          cause side effects to certain individuals.
        </li>
      </ul>
      <p className="text-center text-3xl mt-12">🇨🇦 💟</p>
    </main>
  );
}
