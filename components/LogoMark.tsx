// The cube on its own — no wordmark, no drop — for tight chrome like the admin
// bar where the full stacked lockup (components/Logo) is far too tall. Same
// theme-aware treatment as the rest of the brand: the outline and the lit face
// swap black/white with the theme, the blue face stays constant.
const INK = "fill-[#100f0d] dark:fill-white";
const FACE = "fill-white dark:fill-[#100f0d]";

export function LogoMark({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    // viewBox crops the shared artwork to the cube's own bounds.
    <svg viewBox="94.351 34.89 38.063 42.227" className={className} aria-hidden="true">
      <path
        className={INK}
        d="m113.384 34.89 2.044 1.039 16.987 8.817V66.05l-1.659 1.001-17.372 10.066L96.01 67.051l-1.659-1.001V44.746l16.987-8.817z"
      />
      <path
        fill="#66a4de"
        d="M111.174 55.657v16.326a.217.217 0 0 1-.328.186l-13.222-7.84a.22.22 0 0 1-.107-.187V49.063c0-.163.171-.266.315-.195l13.223 6.594a.22.22 0 0 1 .119.195"
      />
      <path
        className={FACE}
        d="M128.718 49.063v15.079c0 .077-.04.148-.105.187l-13.224 7.84a.216.216 0 0 1-.326-.186V55.657c0-.082.046-.159.12-.195l13.221-6.594a.217.217 0 0 1 .314.195m-2.281-3.038-13.266 6.532a.22.22 0 0 1-.192 0l-13.318-6.631a.217.217 0 0 1-.005-.388l13.136-6.799a.22.22 0 0 1 .199 0l13.45 6.899a.216.216 0 0 1-.004.387"
      />
    </svg>
  );
}
