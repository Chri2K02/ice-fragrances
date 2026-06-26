import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { ScrollTop } from "@/components/ScrollTop";
import { MetaPixel } from "@/components/MetaPixel";
import { JsonLd } from "@/components/JsonLd";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // metadataBase makes every relative OG/canonical URL resolve to an absolute
  // one — without it the social-card and sitemap image links are broken.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE.title,
    template: "%s · Ice Fragrances",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    // Brand
    "Ice Fragrances",
    "icefragrances",
    // Category
    "cologne",
    "fragrance",
    "perfume",
    "eau de parfum",
    "men's cologne",
    "unisex fragrance",
    "niche fragrance",
    "luxury fragrance",
    "premium fragrance",
    "designer fragrance",
    "fragrance oil",
    // Positioning
    "cold-weather cologne",
    "winter fragrance",
    "timeless fragrance",
    "modern fragrance",
    "signature scent",
    "long-lasting cologne",
    "high oil concentration",
    // Signature colognes
    "Frost",
    "Glacier",
    "Hailstone",
    "Iceberg",
    // Scent notes (from the catalog)
    "vanilla",
    "amber",
    "pink pepper",
    "nutmeg",
    "rose",
    "grapefruit",
    "cedarwood",
    "neroli",
    "lavender",
    "blood orange",
    "jasmine",
    "incense",
    "tonka bean",
    "bergamot",
    "eucalyptus",
    "mint",
    "rosemary",
    // Other products
    "scented humidifier",
    "car freshener",
    "air freshener",
    "home fragrance",
    "limited apparel",
    // Shopping intent
    "buy cologne online",
    "free shipping cologne",
    "USA",
    "Canada",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    url: SITE_URL,
    locale: SITE.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <JsonLd />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {/* Better Auth needs no global provider (was: ClerkThemed/ClerkProvider). */}
          <ScrollTop />
          <MetaPixel />
          <Header />
          {children}
          <Footer />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
