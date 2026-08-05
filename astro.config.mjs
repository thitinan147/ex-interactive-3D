// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vektor.example",
  vite: {
    ssr: {
      noExternal: ["three"],
    },
  },
});
