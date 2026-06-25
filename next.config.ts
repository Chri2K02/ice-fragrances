import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enables React's <ViewTransition> so route navigations animate via the
    // browser View Transitions API. Paired with app/template.tsx (wraps routed
    // content as "page-content") and the ::view-transition rules in globals.css.
    viewTransition: true,
  },
};

export default nextConfig;
