# ex-interactive-3D

Interactive 3D product site for **Vektor V-9** (reusable rocket) — Astro + Three.js + GSAP.

Style and architecture reference: Lusion / [oryzo.ai](https://oryzo.ai/) (see `docs/`).

## Live

**https://thitinan147.github.io/ex-interactive-3D/**

Deploy: merge/push to **`main`** → GitHub Actions → GitHub Pages  
Default working branch: **`dev`**  
Details: `docs/DEPLOY.md`

| ทำแล้ว | ยังไม่ทำ / optional |
|--------|---------------------|
| หน้าเว็บ + WebGL + scroll landing | Formspree production |
| GitHub Pages deploy | Custom domain |
| Waitlist **demo mode** | Real-device QA ทุกเครื่อง |
| Mobile layout + low-quality WebGL path | Phase B polish (haze, grain, audio) |

## Branch & deploy

```text
dev  (default)  →  merge when ready  →  main  →  GitHub Actions  →  github.io
```

| Branch | ใช้ทำ | Deploy? |
|--------|--------|---------|
| **`dev`** | งานประจำ / default | ไม่ |
| **`main`** | production / พร้อมโชว์ | ใช่ (auto) |
| `feature/*` | งานย่อยแยกจาก `dev` (optional) | ไม่ |

```bash
# daily work
git checkout dev && git pull

# ship to live
git checkout main && git pull
git merge dev
git push origin main
```

Optional: `git checkout -b feature/my-change` from `dev`, then merge back into `dev` before shipping to `main`.

## Quick start

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:4321/ex-interactive-3D/**  
(`base` is `/ex-interactive-3D/` for project Pages.)

```bash
npm run build
npm run preview
```

## Docs

- `docs/DEPLOY.md` — GitHub Pages + optional Cloudflare
- `docs/ROCKET-BUILD-GUIDE.md` — build guide end-to-end
- `docs/oryzo-ai-tech-stack.md` — reference stack breakdown
- `docs/product-brief.md` — product / brand notes
- `docs/QA-MOBILE.md` — mobile QA checklist

## Waitlist + Open Graph

Form runs in **demo mode** until Formspree is set:

```bash
PUBLIC_SITE_URL=https://thitinan147.github.io/ex-interactive-3D
PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/xxxxxxxx
```

OG asset: `public/meta/og_image.png` (1200×630)

## Launch reel

Default: local MP4 at `public/videos/launch-reel.mp4`.

Optional:

```bash
PUBLIC_VIMEO_ID=123456789
PUBLIC_VIMEO_HASH=
PUBLIC_CF_BEACON=your-token
```
