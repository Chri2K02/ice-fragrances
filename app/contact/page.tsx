import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Ice Fragrances about an order or a product.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-3xl font-semibold mb-2">Contact us</h1>
      <p className="opacity-70 text-sm mb-6">
        Questions about an order or a product? Send us a note and we&apos;ll get
        back to you by email.
      </p>
      <ContactForm />
    </main>
  );
}
