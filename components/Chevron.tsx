// Inline chevron icon — replaces typographic arrows (→ / ←) in link labels.
// Stroke-based and currentColor, matching the More-menu chevron, so it
// inherits the link's color/opacity states for free.
export function Chevron({
  dir = "right",
  size = 11,
  className = "",
}: {
  dir?: "right" | "left" | "down" | "up";
  size?: number;
  className?: string;
}) {
  const rotate = {
    right: "",
    left: "rotate-180",
    down: "rotate-90",
    up: "-rotate-90",
  }[dir];
  return (
    <svg
      viewBox="0 0 6 10"
      width={Math.round(size * 0.6)}
      height={size}
      aria-hidden
      className={`inline-block shrink-0 ${rotate} ${className}`}
    >
      <path
        d="M1 1l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
