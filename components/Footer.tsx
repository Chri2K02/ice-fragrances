export function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10 text-sm opacity-70 flex flex-col sm:flex-row gap-2 justify-between">
        <span>© {new Date().getFullYear()} Ice Fragrances</span>
        <span>
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
