export const siteConfig = {
  name: "Vektor Systems",
  title: "Vektor V-9 — Reusable Orbital Rocket",
  description:
    "Vektor V-9 is a reusable medium-lift orbital rocket. Interactive product experience — join the waitlist for flight slots.",
  twitterHandle: "@vektor",
  ogImagePath: "/meta/og_image.png",
} as const;

export function absoluteUrl(pathname: string, site?: URL | string | undefined) {
  const base =
    typeof site === "string"
      ? site
      : site?.href ??
        import.meta.env.SITE ??
        import.meta.env.PUBLIC_SITE_URL ??
        "https://vektor.example";
  return new URL(pathname, base.endsWith("/") ? base : `${base}/`).href;
}
