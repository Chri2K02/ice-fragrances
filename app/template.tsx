import { ViewTransition } from "react";

// template.tsx re-mounts on every navigation (unlike layout.tsx), so wrapping
// the routed page here gives every route a consistent crossfade + slide-up.
// The matching ::view-transition(page-content) rules live in app/globals.css.
// Static chrome carries its own viewTransitionName on the <header>/<footer>
// roots (components/Header.tsx, components/Footer.tsx) so it persists instead
// of re-animating.
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition name="page-content">{children}</ViewTransition>;
}
