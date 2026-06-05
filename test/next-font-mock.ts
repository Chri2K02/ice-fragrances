// Stub for next/font loaders in the Vitest environment (they only run under
// the Next.js build pipeline). Returns the shape components expect.
export default function nextFontMock() {
  return { className: "", style: { fontFamily: "" }, variable: "" };
}
