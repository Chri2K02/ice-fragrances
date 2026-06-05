export function logoForTheme(theme: string | undefined): string {
  return theme === "dark" ? "/logo-dark.png" : "/logo-light.png";
}
