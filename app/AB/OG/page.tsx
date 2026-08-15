import type { Metadata } from "next";
import { OGLab } from "./OGLab";

// Internal OG-card lab: preset variations + a knobs playground over the
// hand-composed card renderer (/AB/OG/render). Unlinked and noindexed.
export const metadata: Metadata = {
  title: "A/B — OG card",
  robots: { index: false, follow: false },
};

export default function OGABPage() {
  return <OGLab />;
}
