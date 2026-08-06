/** Public asset path that respects Astro `base` (GitHub Pages project sites). */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const clean = path.replace(/^\//, "");
  return `${base}${clean}`;
}
