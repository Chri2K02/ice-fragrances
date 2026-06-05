import { describe, it, expect } from "vitest";
import { logoForTheme } from "@/lib/theme";

describe("logoForTheme", () => {
  it("uses the white-letter logo in dark mode", () => {
    expect(logoForTheme("dark")).toBe("/logo-dark.png");
  });
  it("uses the black-letter logo in light mode", () => {
    expect(logoForTheme("light")).toBe("/logo-light.png");
  });
  it("defaults to the light logo when theme is undefined", () => {
    expect(logoForTheme(undefined)).toBe("/logo-light.png");
  });
});
