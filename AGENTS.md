## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Local URL includes the project base: `http://127.0.0.1:4321/ex-interactive-3D/`.

## Git branches

- **Default branch is `dev`.** Do day-to-day work on `dev` (or short-lived `feature/*` off `dev`).
- Merge `dev` → `main` only when ready to ship — push to `main` deploys GitHub Pages.
- Do not treat `main` as the daily working branch. Hotfixes on `main` only when the user asks.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
