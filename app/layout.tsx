import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ClerkThemed } from "@/components/ClerkThemed";
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
    "Ice Fragrances",
    "cologne",
    "fragrance",
    "perfume",
    "cold-weather cologne",
    "winter fragrance",
    "Frost",
    "Glacier",
    "Hailstone",
    "Iceberg",
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
          <ClerkThemed>
            <ScrollTop />
            <MetaPixel />
            <Header />
            {children}
            <Footer />
            <Toaster />
          </ClerkThemed>
        </ThemeProvider>
      </body>
    </html>
  );
}
