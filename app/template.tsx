import { ViewTransition } from "react";

// template.tsx re-mounts on every navigation (unlike layout.tsx), so wrapping
// the routed page here gives every route a consistent crossfade + slide-up.
// The matching ::view-transition(page-content) rules live in app/globals.css.
// Static chrome (Header/Footer) stays in layout.tsx with its own
// viewTransitionName so it persists instead of re-animating.
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition name="page-content">{children}</ViewTransition>;
}
