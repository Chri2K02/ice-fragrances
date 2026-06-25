import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// PWA / installability + richer mobile presentation. Icons reference the app
// icon file-convention assets (app/icon.png → /icon.png is a 512×512 square;
// app/apple-icon.png → /apple-icon.png is 180×180). Colors match the dark
// brand surface (--bg / logo sky blue from globals.css).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#060606",
    theme_color: "#34b6f5",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
