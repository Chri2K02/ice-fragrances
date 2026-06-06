import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ClerkThemed } from "@/components/ClerkThemed";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { ScrollTop } from "@/components/ScrollTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ice Fragrances",
  description: "Premium cold-weather colognes. Free shipping to US & Canada.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClerkThemed>
            <ScrollTop />
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
