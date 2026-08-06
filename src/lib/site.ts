import { asset } from "./asset";

export const siteConfig = {
  name: "Vektor Systems",
  title: "Vektor V-9 — Reusable Orbital Rocket",
  description:
    "Vektor V-9 is a reusable medium-lift orbital rocket. Interactive product experience — join the waitlist for flight slots.",
  twitterHandle: "@vektor",
  ogImagePath: "meta/og_image.png",
} as const;

export function absoluteUrl(pathname: string, site?: URL | string | undefined) {
  const origin =
    typeof site === "string"
      ? site
      : site?.href ??
        import.meta.env.SITE ??
        import.meta.env.PUBLIC_SITE_URL ??
        "https://thitinan147.github.io";
  const originNorm = origin.endsWith("/") ? origin : `${origin}/`;
  const withBase = asset(pathname.replace(/^\//, ""));
  return new URL(withBase.replace(/^\//, ""), originNorm).href;
}
