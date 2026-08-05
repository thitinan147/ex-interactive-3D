# ex-interactive-3D

Interactive 3D product site for **Vektor V-9** (reusable rocket) — Astro + Three.js + GSAP.

Style and architecture reference: Lusion / [oryzo.ai](https://oryzo.ai/) (see `docs/`).

## Status — local only (ตอนนี้)

> **ทำงานบนเครื่องเท่านั้น** — ยังไม่ deploy production  
> รันด้วย `npm run dev` / `npm run preview`  
> Cloudflare, Formspree จริง, custom domain = ทีหลัง (ดู `docs/DEPLOY.md`)

| ทำบน local แล้ว | ยังไม่ทำ |
|-----------------|----------|
| หน้าเว็บ + WebGL + scroll | Deploy Cloudflare |
| Motion / preloader | Formspree endpoint production |
| OG asset ใน `public/meta/` | Public URL / OG preview จริงบนโซเชียล |
| Waitlist **demo mode** | Analytics / domain |
| Mobile layout + perf (dynamic `three`, low-quality rocket) | Real-device QA ทุกเครื่อง |

## Quick start

```bash
npm install
npm run dev
```

เปิด http://127.0.0.1:4321/

```bash
npm run build
npm run preview
```

## Docs

- `docs/ROCKET-BUILD-GUIDE.md` — build guide end-to-end
- `docs/DEPLOY.md` — Cloudflare Pages (ทีหลัง — ยังไม่รัน)
- `docs/oryzo-ai-tech-stack.md` — reference stack breakdown
- `docs/product-brief.md` — product / brand notes
- `docs/QA-MOBILE.md` — mobile QA checklist + automated results

## Waitlist + Open Graph (local)

ตอนนี้ฟอร์มรัน **demo mode** (กดแล้ว UI success ไม่ยิง CRM)

เมื่อพร้อม production ค่อย copy `.env.example` → `.env` หรือ env บน host:

```bash
PUBLIC_SITE_URL=https://your-project.pages.dev
PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/xxxxxxxx
```

1. สร้าง form ที่ [Formspree](https://formspree.io)
2. ใส่ `PUBLIC_FORMSPREE_ENDPOINT`
3. ตั้ง `PUBLIC_SITE_URL` ให้ตรงโดเมนจริง (sitemap + absolute OG URL)
4. Deploy ทีหลังตาม `docs/DEPLOY.md`

OG ไฟล์ local: `public/meta/og_image.png` (1200×630)  
ดูตอน dev: http://127.0.0.1:4321/meta/og_image.png

## Launch reel (Grok gen)

Default player uses a **local MP4** generated with Imagine:

```
image_gen (16:9 pad frame)
  → image_to_video (6s push-in + engine glow)
  → public/videos/launch-reel.mp4
```

Watch launch / Play reel → overlay HTML5 `<video>`.

Optional override with Vimeo / analytics:

```bash
PUBLIC_VIMEO_ID=123456789          # if set, uses Vimeo instead of local file
PUBLIC_VIMEO_HASH=
PUBLIC_CF_BEACON=your-token        # Cloudflare Web Analytics
```

Analytics: `track()` + `data-track` clicks; CF beacon only if token set. Dev logs events in console.
