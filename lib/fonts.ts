import localFont from "next/font/local";

// Glacial Indifference — used for the product section display type.
// Bold for titles/headers, Regular for description body text.
export const glacial = localFont({
  src: "../app/fonts/GlacialIndifference-Bold.otf",
  display: "swap",
});

export const glacialRegular = localFont({
  src: "../app/fonts/GlacialIndifference-Regular.otf",
  display: "swap",
});
