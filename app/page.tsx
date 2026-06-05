"use client";
import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroVideo } from "@/components/HeroVideo";
import { Products } from "@/components/Products";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <main>
      <Header onCartClick={() => setCartOpen(true)} />
      <HeroVideo />
      <Products />
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
