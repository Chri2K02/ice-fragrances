import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/font/local": path.resolve(__dirname, "./test/next-font-mock.ts"),
      "next/font/google": path.resolve(__dirname, "./test/next-font-mock.ts"),
    },
  },
});
