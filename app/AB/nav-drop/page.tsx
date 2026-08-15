import type { Metadata } from "next";
import { ABDemo } from "./ABDemo";

// Internal A/B comparison page for the header's droplet collapse — two
// copies of the nav side by side on one shared scroll. Not linked from
// anywhere; kept out of indexes.
export const metadata: Metadata = {
  title: "A/B — nav droplet",
  robots: { index: false, follow: false },
};

export default function NavDropABPage() {
  return <ABDemo />;
}
