import { clerkMiddleware } from "@clerk/nextjs/server";

// Next 16 renamed the `middleware` file convention to `proxy`. Clerk's handler
// is the proxy's default export; the matcher is unchanged.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|webp|gif|svg|ico|ttf|woff2?|otf|mp4|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
