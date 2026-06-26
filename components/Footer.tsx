import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="border-t border-black/10 dark:border-white/10 mt-20"
      // Persist the footer across navigations — only the routed page animates.
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm opacity-70 flex flex-col sm:flex-row gap-2 justify-between">
        <span>© {new Date().getFullYear()} Ice Fragrances</span>
        <span className="flex gap-4">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          <Link href="/terms" className="underline">
            Terms
          </Link>
          <a
            href="mailto:icefragrances@icefragrances.com"
            className="underline"
          >
            icefragrances@icefragrances.com
          </a>
        </span>
      </div>
    </footer>
  );
}
