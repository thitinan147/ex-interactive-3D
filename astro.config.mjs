// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// Project Pages: https://thitinan147.github.io/ex-interactive-3D/
const site =
  process.env.PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://thitinan147.github.io";

export default defineConfig({
  site,
  base: "/ex-interactive-3D/",
  integrations: [sitemap()],
  vite: {
    ssr: {
      noExternal: ["three"],
    },
  },
});
