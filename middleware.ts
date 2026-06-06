import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|webp|gif|svg|ico|ttf|woff2?|otf|mp4|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
