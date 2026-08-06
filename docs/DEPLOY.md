# Deploy

Repo: `https://github.com/thitinan147/ex-interactive-3D`  
Stack: Astro **static** → output `dist/`  
`base`: `/ex-interactive-3D/` (GitHub project Pages)

---

## GitHub Pages (active path)

Site URL: **https://thitinan147.github.io/ex-interactive-3D/**

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Push to `main` (or run workflow **Deploy to GitHub Pages** manually)
3. Workflow: `.github/workflows/deploy-github-pages.yml`
4. Local with base path: `http://127.0.0.1:4321/ex-interactive-3D/`

### Branch rule

```text
dev (default)  →  merge when ready  →  main  →  Actions  →  github.io
```

- **Default branch:** `dev` — daily development.
- **Production:** `main` — push/merge here deploys GitHub Pages.
- Optional: short `feature/*` branches off `dev`, then merge into `dev` before shipping to `main`.

---

## Cloudflare Pages (optional alternate)

---

## 0. เช็คก่อน deploy

```bash
npm ci
npm run build
npm run preview
```

ตรวจ:

- [ ] `dist/index.html` มีอยู่
- [ ] assets ใต้ `dist/` โหลดได้ใน preview
- [ ] ไม่มี secret ใน client bundle (ไม่มี `.env` production แปลกๆ)

---

## 1. Cloudflare Pages (แนะนำ — ผูก Git)

1. เข้า [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. เลือก repo `thitinan147/ex-interactive-3D` (authorize GitHub ถ้ายัง)
3. ตั้งค่า build:

| Field | Value |
|-------|--------|
| Production branch | `main` |
| Framework preset | Astro (หรือ None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (default) |
| Node version | `22` (หรือ ≥ 22.12 ตาม `package.json` engines) |

4. **Environment variables** (ถ้ามีทีหลัง):
   - ตอนนี้ไม่จำเป็น
   - ถ้าใส่ public config ใช้ prefix ตาม Astro เช่น `PUBLIC_*`
5. Save → รอ deploy แรก
6. ได้ URL แบบ `https://<project>.pages.dev`
7. (Optional) **Custom domains** → ใส่โดเมน → ตั้ง DNS ตามที่ Cloudflare บอก

### Deploy อัตโนมัติ

- Push ไป `main` → production deploy
- PR / branch อื่น → preview URL (ถ้าเปิด branch deploys)

---

## 2. Deploy แบบ CLI (ทางเลือก)

ใช้เมื่อไม่อยากผูก Git หรือต้องการ one-off:

```bash
npm run build
npx wrangler pages deploy dist --project-name=ex-interactive-3d
```

ต้อง login Cloudflare ก่อน (`npx wrangler login`)

---

## 3. หลังขึ้น production — smoke checklist

- [ ] เปิด URL บน desktop: hero 3D + scroll ทำงาน
- [ ] มือถือจริง 1 เครื่อง (Safari iOS ถ้ามี)
- [ ] Preloader จบ ไม่ค้าง
- [ ] Variant cards เปลี่ยนสีจรวด
- [ ] Waitlist form submit (แม้ยังเป็น demo)
- [ ] OG / link preview (หลังใส่ `og_image` แล้ว)
- [ ] HTTPS เขียว / ไม่มี mixed content

---

## 4. Cache & headers (optional ทีหลัง)

Astro hashed assets ใต้ `/_astro/` อยู่แล้ว  
ถ้าต้องการ header เพิ่ม ใช้ `public/_headers` (Cloudflare Pages):

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/
  Cache-Control: public, max-age=0, must-revalidate
```

---

## 5. สิ่งที่ยังไม่ต้องมีก่อน deploy แรก

| รายการ | หมายเหตุ |
|--------|----------|
| Mailchimp จริง | form demo พอสำหรับ smoke |
| Vimeo | overlay shell พอ |
| Custom domain | ใช้ `*.pages.dev` ก่อนได้ |
| Analytics | ใส่ทีหลังได้ |

---

## 6. ถ้า build ล้มบน Cloudflare

1. ดู build log — มักเป็น Node version ต่ำกว่า engines  
2. ตั้ง Environment variable: `NODE_VERSION=22`  
3. ล้าง cache แล้ว Retry deployment  
4. รัน `npm run build` local ให้ผ่านก่อน push ใหม่  

---

## 7. Definition of Done (deploy เกี่ยวข้อง)

จาก `ROCKET-BUILD-GUIDE.md` — ข้อ deploy:

5. Deploy public URL บน Cloudflare  
6. Mobile ใช้การได้โดยไม่พัง  

เมื่อข้ออื่น (3D hero, scroll, content, CTA) พร้อมแล้ว ค่อยรันคู่มือนี้เพื่อปิด v1

---

*ยังไม่ deploy ในรอบนี้ — เอกสารเตรียมไว้ให้รันเมื่อพร้อมเท่านั้น.*
