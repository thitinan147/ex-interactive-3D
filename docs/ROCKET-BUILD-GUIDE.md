# คู่มือสร้างเว็บขายจรวด (Interactive 3D)

แนวทางทำตั้งแต่ setup จน deploy เสร็จ  
**สินค้า:** จรวด (product marketing / pre-order site)  
**สไตล์เว็บ:** แนว [oryzo.ai](https://oryzo.ai/) — ดู stack อ้างอิงใน `oryzo-ai-tech-stack.md`

> เป้าหมายไม่ใช่ clone Oryzo 1:1 แต่ใช้ **สถาปัตยกรรมเดียวกัน**: static shell + WebGL full-screen + scroll-section director + typography motion + deploy edge CDN

---

## 0. ภาพรวมโปรเจกต์

### 0.1 แนวคิด

เว็บ editorial / agency-grade สำหรับ **ขายจรวด** (หรือ pre-order / waitlist):

- Hero: จรวด 3D หมุน/เลื่อนตาม scroll
- Features: เชื้อเพลิง, แรงขับ, payload, safety
- Specs / open data: ตารางตัวเลข + โมเดล “open weight” เสียดสีหรือจริงตามโทนแบรนด์
- CTA: pre-order / newsletter / ติดต่อ

### 0.2 โครงสร้างหน้า (map จาก Oryzo → ของเรา)

| Oryzo | ของเรา (Rocket) | บทบาท |
|-------|-----------------|--------|
| Preloader | Preloader | โหลด assets + intro canvas |
| Hero (coaster + hand) | Hero (จรวด + pad/ปล่อย) | first impression |
| AI / features | Propulsion & Systems | จุดขายทางเทคนิค |
| Wearable gallery | Variants / Payload kits | เลือก config จรวด |
| Table scene | Mission control desk (optional) | ฉาก dens ถ้ามี capacity |
| Product / open-weight | Specs + Model download | ข้อมูล + trust |
| Video overlay | Launch reel (Vimeo) | วิดีโอหนัก |
| Footer + Mailchimp | CTA + waitlist | conversion |

### 0.3 Stack ที่ใช้จริง (practical — ตาม recipe ใน tech stack doc)

| ชั้น | เลือกใช้ | หมายเหตุ |
|------|----------|----------|
| Framework | **Astro** (static) | shell + SEO เหมือน `/_astro/*` |
| 3D | **Three.js** ล่าสุด | ไม่ต้อง fork แบบ Lusion ตอนแรก |
| Models | **glTF + Draco** (หรือ procedural จาก img2threejs) | แทน custom `.buf` |
| UI motion | **GSAP** (+ SplitText ถ้ามี Club) | text reveal แนว editorial |
| Scroll | **custom section director** | ไม่บังคับ Lenis / ScrollTrigger |
| 2D motion (optional) | **Rive** | icon / harvesting-style bits |
| Video | **Vimeo** | reel ปล่อยจรวด |
| Newsletter | **Mailchimp** / equivalent | waitlist |
| Host | **Cloudflare Pages** | CDN + HTTP/3 |
| CSS | custom design tokens | ไม่ใช้ Tailwind ถ้าอยากโทน agency เป๊ะ |
| Fonts | display serif + mono | แนว Literata + DM Mono |

**ยังไม่ทำตอน v1:** Gaussian SOG, custom `.buf`, TAA/SSR เต็มชุด, Lusion FBO framework

---

## 1. Phase 0 — เตรียมก่อนเขียนโค้ด (½–1 วัน)

### 1.1 ตัดสินใจผลิตภัณฑ์

เขียนลงไฟล์สั้นๆ (เช่น `docs/product-brief.md`):

- ชื่อแบรนด์ / ชื่อรุ่นจรวด (1–3 variants)
- ราคาหรือ “request quote / pre-order”
- 3 จุดขายหลัก (เช่น thrust, range, reusable)
- โทน: serious aerospace / satirical (แบบ Oryzo) / hybrid
- ภาษาเว็บ: ไทย / อังกฤษ / bilingual

### 1.2 เครื่องมือที่ต้องมี

```
- Node.js 20+
- pnpm หรือ npm
- Git
- VS Code (แนะนำ)
- บัญชี Cloudflare (ฟรีได้)
- (optional) Blender — ถ้า export glTF เอง
- (optional) GSAP Club — ถ้าใช้ SplitText ถูก license
- (optional) Rive editor
```

### 1.3 โฟลว์ asset จรวด (2 ทาง)

**ทาง A — Grok gen รูป + skill `img2threejs` (แนะนำเริ่มเร็ว)**

```
prompt จรวด product shot
  → image_gen / image_edit
  → img2threejs (procedural Three.js factory)
  → ใส่ใน scene
```

เหมาะ: hero prop, variant เล็ก, stylized rocket

**ทาง B — Blender → glTF**

```
โมเดลใน Blender
  → export glTF + Draco
  → public/models/rocket.glb
  → GLTFLoader ใน Three
```

เหมาะ: geometry ซับซ้อน, animation ปล่อย, ทีมมี 3D artist

**ผสมได้:** hero ใช้ img2threejs ก่อน แล้วค่อยเปลี่ยนเป็น glTF ทีหลัง

### 1.4 เกณฑ์รูปที่ gen แล้วแปลง 3D ดี

- object เดี่ยว พื้นหลังเรียบ
- มุม 3/4 เห็นลำตัว + จมูก + ครีบ
- แสง studio สม่ำเสมอ
- ไม่มีควัน/ไฟ/พื้นหลัง launch pad วุ่น (gen แยก layer ทีหลัง)

ตัวอย่าง prompt:

> Product render of a single modern reusable orbital rocket, tall white body with black thermal tiles near engines, four grid fins, landing legs folded, three-quarter view, clean studio gray background, soft HDRI lighting, sharp silhouette, no smoke, no people, no text.

---

## 2. Phase 1 — Setup โปรเจกต์ (วัน 1)

### 2.1 สร้าง repo

```bash
cd /Users/thitinan/Documents/projects/ex-interactive-3D
npm create astro@latest . -- --template minimal --typescript strict --install --no-git
# ถ้าโฟลเดอร์ไม่ว่าง: สร้าง subdir rocket-site แล้วย้าย หรือ init เอง
```

หรือแยกชัด:

```bash
npm create astro@latest rocket-site -- --template minimal --typescript strict --install --git
cd rocket-site
```

### 2.2 ติดตั้ง dependencies

```bash
npm install three gsap
npm install -D @types/three
# optional ทีหลัง:
# npm install @rive-app/canvas
# npm install @vimeo/player
```

### 2.3 โครงโฟลเดอร์เป้าหมาย

```
rocket-site/
├── public/
│   ├── models/          # .glb / ถ้ามี
│   ├── textures/        # webp env, materials
│   ├── images/          # UI 2D, og
│   ├── fonts/           # woff2
│   ├── audios/          # optional
│   └── meta/            # favicon, og
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── styles/
│   │   ├── tokens.css   # CSS variables
│   │   └── global.css
│   ├── components/      # Astro partials (header, footer, sections)
│   ├── webgl/
│   │   ├── App.ts       # renderer, scene, loop
│   │   ├── ScrollDirector.ts
│   │   ├── scenes/
│   │   │   ├── HeroScene.ts
│   │   │   └── FeaturesScene.ts
│   │   ├── models/      # createRocketModel.ts (จาก img2threejs)
│   │   └── post/        # FXAA / bloom ทีหลัง
│   └── main.ts          # entry client
├── package.json
└── astro.config.mjs
```

### 2.4 HTML shell (แนว Oryzo)

ใน `index.astro` วางโครงประมาณนี้:

```html
<canvas id="canvas"></canvas>
<div id="ui">
  <div id="preloader">…</div>
  <header id="site-header">…</header>
  <main id="pages-container">
    <section id="hero">…</section>
    <section id="systems">…</section>
    <section id="variants">…</section>
    <section id="specs">…</section>
    <section id="reel">…</section>
    <section id="order">…</section>
    <section id="footer">…</section>
  </main>
  <div id="scroll-indicator">Scroll to continue</div>
</div>
<div id="video-overlay" hidden>…</div>
```

กฎ: **WebGL = พื้นหลังเต็มจอ**, DOM = ตัวอักษร/ปุ่ม/SEO

### 2.5 Design tokens (อย่าใช้ default AI purple)

`src/styles/tokens.css` — โทน aerospace ตัวอย่าง:

```css
:root {
  --color-void: #0b0d10;
  --color-steel: #c5ccd6;
  --color-white: #f4f1ea;
  --color-ember: #ff5a1f;   /* accent ปล่อย / CTA */
  --color-fuel: #3dd6c6;    /* secondary tech */
  --display-font: "Literata", "Times New Roman", serif;
  --mono-font: "DM Mono", ui-monospace, monospace;
  --h1: clamp(2.5rem, 6vw, 5rem);
  --body1: 1.05rem;
  --site-padding-x: clamp(1rem, 4vw, 3rem);
  --grid-columns: 12;
}
```

ฟอนต์: self-host WOFF2 ใต้ `/fonts/` (Literata + DM Mono แนว Oryzo หรือชุดอื่นที่ license ชัด)

### 2.6 เช็ค Phase 1 ผ่าน

- [ ] `npm run dev` ขึ้นหน้า
- [ ] มี canvas + sections scroll ได้
- [ ] tokens + font โหลด
- [ ] ยังไม่มี 3D ก็ได้ — shell ต้องนิ่งก่อน

---

## 3. Phase 2 — Three.js core (วัน 2–4)

### 3.1 WebGL bootstrap

`src/webgl/App.ts` ทำอย่างน้อย:

1. `WebGLRenderer` (antialias, alpha ตามดีไซน์, `outputColorSpace = SRGB`)
2. `PerspectiveCamera` + resize (`pixelRatio` cap 1.5–2 บน mobile)
3. `Scene` + lights ชั่วคราว (ambient + directional)
4. `requestAnimationFrame` loop + clock
5. mount เข้า `#canvas`
6. dispose ตอน HMR/unmount

### 3.2 ใส่จรวดเข้า scene

**ถ้าใช้ img2threejs**

1. Gen รูปจรวดด้วย Grok (`image_gen`)
2. รัน skill img2threejs จนได้ factory เช่น `createRocketModel.ts`
3. import ใน `HeroScene` → `scene.add(rocket)`
4. ตั้ง scale / position ให้ศูนย์กลางฉาก

**ถ้าใช้ glTF**

```ts
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
// โหลด /models/rocket.glb → scene
```

### 3.3 Camera & framing

- Hero: จรวดเต็มแนวตั้ง เว้นที่ซ้าย/ขวาให้ headline
- Mobile: ดึงกล้องถอย / ลด scale object
- เก็บ keyframe camera อย่างง่ายใน array ก่อน (อย่ารอ Blender path)

### 3.4 Lighting ขั้นต่ำที่ดูแพง

- 1 key + 1 fill + 1 rim (หรือ env map อย่างเดียว)
- `RoomEnvironment` / HDRI เบาๆ ใน `public/textures/env_hero.webp` (หรือ `.hdr` แปลง)
- วัสดุจรวด: `MeshPhysicalMaterial` — metalness สูงที่ครีบ/หัวฉีด, paint ลำตัว roughness กลาง

### 3.5 Post-processing (ค่อยๆ)

ลำดับเพิ่ม:

1. ไม่มี post ก่อน — ให้ geometry/material ถูก
2. FXAA หรือ renderer AA
3. mild Bloom ที่ engine bells / emissive
4. ทีหลังค่อย LUT / tone mapping AgX–ACES

### 3.6 Mobile downgrade (เรียนจาก Oryzo)

```
isMobile →
  pixelRatio min
  ปิด bloom
  ลด shadow
  texture half-res ถ้ามี
```

### 3.7 เช็ค Phase 2 ผ่าน

- [ ] จรวดเห็นบน desktop
- [ ] resize ไม่พัง
- [ ] mobile ยัง > ~30fps บนเครื่องจริงหรือ throttling
- [ ] ไม่มี memory leak ตอน hot reload แบบหยาบๆ

---

## 4. Phase 3 — Scroll director (วัน 5–7)

Oryzo **ไม่มี** ScrollTrigger — เราเขียน director เองได้

### 4.1 แนวคิด

```
scrollY / section ranges
  → progress 0..1 ต่อ section
  → อัปเดต camera, rocket rotation, prop visibility, DOM class
```

### 4.2 `ScrollDirector.ts` ทำอะไร

1. อ่านตำแหน่ง `#hero`, `#systems`, … (`getBoundingClientRect` หรือ offsetTop)
2. map scroll → `sectionId + localProgress`
3. emit ไปที่ scene: `heroScene.setProgress(t)`, `systemsScene.setProgress(t)`
4. อัปเดต `#scroll-indicator` / active nav
5. `prefers-reduced-motion` → ข้าม scrub หนัก โชว์ static frame

### 4.3 Timeline ตัวอย่างต่อ section

| Section | progress 0 → 1 |
|---------|----------------|
| Hero | จรวด idle หมุนช้า → เงยขึ้น / ซูมเข้า |
| Systems | แยกชิ้นส่วน (exploded view) ชี้ engine / tank / avionics |
| Variants | สลับ skin / fin config |
| Specs | กล้อง top-down หรือ isometric กับ overlay ตัวเลข |
| Order | จรวดกลับ rest pose + แสง accent CTA |

### 4.4 DOM sync

- class `.is-active` บน section ที่อยู่ใน viewport
- GSAP เล่น text ครั้งเดียวตอนเข้า section (ไม่ต้อง scrub ทุกตัวอักษรถ้าหนัก)

### 4.5 เช็ค Phase 3 ผ่าน

- [ ] เลื่อนทั้งหน้า กล้อง/จรวดต่อเนื่อง ไม่กระตุกกระโดด section
- [ ] refresh กลางหน้าแล้วยัง sync
- [ ] reduced-motion ใช้ได้

---

## 5. Phase 4 — UI motion & content (วัน 8–10)

### 5.1 GSAP

- Headline split reveal ตอนจบ preloader / เข้า hero
- ปุ่ม CTA hover (อย่า over-animate)
- Optional: GSAP Flip สลับ variant cards

SplitText: ใช้ได้ถ้ามี license; ไม่งั้น **SplitType** ฟรี หรือ split ด้วย JS เอง

### 5.2 Copy structure (ร่าง)

**Hero**

- H1: ชื่อรุ่น
- Sub: one-liner (orbit / suborbital / cargo)
- Primary CTA: Pre-order / Join waitlist
- Secondary: Watch launch

**Systems** — 3–6 feature blocks (ตัวเลขจริงหรือ fictional ให้สม่ำเสมอ)

**Variants** — cards: Standard / Heavy / Reusable

**Specs** — ตาราง mono font (แนว Oryzo technical aside)

**Order** — form สั้น: email + config preference

### 5.3 Preloader

1. โหลด model + env + fonts สำคัญ
2. progress 0–100 บน DOM หรือ canvas เล็ก
3. fade ออก → ปล่อย scroll + เล่น hero intro

### 5.4 Rive (optional)

ใช้เฉพาะจุดที่ designer อยากคุม timeline 2D (ไอคอน fuel gauge, stamp “FLIGHT PROVEN”) — อย่า replace 3D hero

### 5.5 เช็ค Phase 4 ผ่าน

- [ ] อ่านจบหน้าบน mobile โดยไม่ติด preloader
- [ ] text ไม่ซ้อน canvas จนอ่านไม่ออก
- [ ] CTA เห็นชัดทุก breakpoint

---

## 6. Phase 5 — Asset pipeline ให้เป็นระบบ (คู่ขนาน Phase 2–4)

### 6.1 Naming

```
public/models/rocket_hero.glb
public/models/rocket_engine_cutaway.glb   # optional
public/textures/rocket/albedo.webp
public/textures/env_hero.webp
public/images/og.png
public/fonts/Literata.woff2
```

### 6.2 สร้างจรวดด้วย Grok + img2threejs (รายละเอียด)

1. **Gen base image** — product shot เดียว มุม 3/4  
2. **(optional) image_edit** — ปรับสีลาย, โลโก้ลำตัว, เก็บ silhouette เดิม  
3. **บอก agent:**  
   `ใช้ img2threejs แปลงรูปนี้เป็น Three.js rocket prop สำหรับ hero, profile generic, real-time browser`  
4. skill จะ: validate → assess → sculpt spec → build pass-by-pass → compare screenshot  
5. ย้าย factory ไป `src/webgl/models/`  
6. ถ้าต้องการมุมอื่น: gen รูป side/back เพิ่ม แล้ว refine

### 6.3 Texture rules (จากแนว Oryzo)

- WebP เป็นหลัก
- mobile variant: `*_mobile.webp` หรือ half res
- อย่าเสิร์ฟ PNG 4K ทั้งหน้า

### 6.4 Audio (optional)

- whoosh เบาตอนเข้า section / hover CTA
- ต้องมี user gesture ก่อน AudioContext
- ใส่ mute default บน mobile

---

## 7. Phase 6 — Conversion & third-party (วัน 11–12)

### 7.1 Waitlist / pre-order

- ฟอร์ม footer → Mailchimp (หรือ Buttondown / Loops / backend เอง)
- อย่าใส่ checkout จริงถ้ายังไม่พร้อม legal/shipping — ใช้ “Register interest”

### 7.2 Vimeo launch reel

- อัปโหลดวิดีโอ private/unlisted
- overlay เต็มจอ + custom close
- prefetch เมื่อใกล้ section `#reel`

### 7.3 Analytics

- Cloudflare Web Analytics (เบา) หรือ Plausible
- track: CTA click, form submit, video open

### 7.4 SEO / share

Astro frontmatter + meta:

- title, description
- OG image `/meta/og_image.png` (gen ด้วย Grok ได้ — โชว์จรวด + ชื่อรุ่น)
- `sitemap` (Astro integration)

---

## 8. Phase 7 — Polish, performance, a11y (วัน 13–14)

### 8.1 Performance checklist

| ตรวจ | เป้า |
|------|------|
| Lighthouse mobile perf | พอใช้; อย่าคาด 100 บน WebGL heavy |
| First paint shell | HTML/CSS มาก่อน 3D |
| Model size | hero glb บีบ / Draco; procedural คุม poly |
| Texture | WebP, max 1–2K บน desktop |
| Main bundle | แยก `three` dynamic import หลัง preloader ถ้าต้องการ |
| FPS | desktop ~60, mobile mid-tier ~30+ |

### 8.2 A11y

- `prefers-reduced-motion`
- focus states บนลิงก์/ปุ่ม
- form labels
- canvas มี `aria-hidden="true"` ถ้า decorative; เนื้อหาสำคัญอยู่ใน DOM

### 8.3 Visual QA

- iPhone Safari, Chrome Android, desktop Chrome/Firefox
- notch / `100dvh`
- slow 3G throttling — preloader ต้องไม่ค้างเงียบ

---

## 9. Phase 8 — Deploy เสร็จโปรเจกต์ (วัน 15)

### 9.1 Build

```bash
npm run build
npm run preview
```

ตรวจ `dist/` มี assets ครบ

### 9.2 Cloudflare Pages

1. Push GitHub/GitLab  
2. Cloudflare Pages → Create project → ผูก repo  
3. Build command: `npm run build`  
4. Output directory: `dist`  
5. ตั้ง custom domain  

### 9.3 หลังขึ้น production

- [ ] HTTPS ใช้งานได้  
- [ ] ฟอร์ม subscribe เข้า list จริง  
- [ ] OG preview ใน LINE/X/iMessage  
- [ ] วิดีโอ Vimeo ไม่โดน block domain  
- [ ] ดู Real User: เครื่องมือถือจริง 1 เครื่อง  

### 9.4 Definition of Done (โปรเจกต์นี้ถือว่าเสร็จ)

1. หน้าเดียว (หรือน้อย page) เลื่อนครบ story จรวด  
2. Hero 3D จรวด + scroll คุมกล้องอย่างน้อย 2 sections  
3. Content จุดขาย + specs อ่านได้  
4. CTA waitlist ใช้งานได้  
5. Deploy public URL บน Cloudflare  
6. Mobile ใช้การได้โดยไม่พัง  

**ยังไม่บังคับใน v1:** splat ฉาก control room, custom binary format, multi-page shop, payment

---

## 10. แผนรายวันแบบสรุป (ประมาณ 2–3 สัปดาห์)

| วัน | งาน |
|-----|-----|
| 0 | brief สินค้า + โทน + ชื่อรุ่น |
| 1 | Astro setup + shell + tokens + fonts |
| 2–3 | Three App + จรวด (img2threejs หรือ glb) |
| 4 | lighting + mobile downgrade |
| 5–6 | ScrollDirector + hero/systems progress |
| 7 | exploded / variants logic |
| 8–9 | copy + GSAP text + preloader |
| 10 | form + footer + optional Vimeo |
| 11–12 | polish UI, OG, SEO |
| 13–14 | perf + a11y + device QA |
| 15 | Cloudflare deploy + smoke test |

---

## 11. ลำดับ “ทำก่อน / ทำทีหลัง” (อย่าสลับ)

```
ทำก่อน                              ทำทีหลัง
─────────────────────────────       ────────────────────────────
Product brief + section map         Mission-control dense scene
Astro shell + tokens                Gaussian splats
Three + rocket 1 ชิ้น                Custom .buf pipeline
Scroll → camera 2 sections          TAA / SSR / LUT เต็ม
GSAP text + preloader               Rive ทุกจุด
Waitlist + Cloudflare               Commerce / 3D config full SKU
img2threejs หรือ 1 glb              Multi-rocket catalog CMS
```

---

## 12. คำสั่งคุยกับ agent (copy ใช้ได้)

**Setup**

> สร้างโปรเจกต์ Astro TypeScript ใน repo นี้ โครงตาม `ROCKET-BUILD-GUIDE.md` Phase 1 — shell ขายจรวด มี canvas + sections hero/systems/variants/specs/order

**Gen รูปจรวด**

> gen รูป product shot จรวด reusable orbital มุม 3/4 พื้นหลัง studio ใช้เป็น reference สำหรับ img2threejs

**แปลง 3D**

> ใช้ skill img2threejs แปลงรูปนี้เป็น Three.js rocket hero prop แล้วต่อเข้า WebGL App

**Scroll**

> เขียน ScrollDirector ผูก #hero กับ #systems คุม camera + rocket rotation ตาม progress

**Deploy**

> เตรียม build Cloudflare Pages และตรวจ checklist Phase 8

---

## 13. ความเสี่ยง & วิธีเลี่ยง

| ความเสี่ยง | เลี่ยงยังไง |
|------------|------------|
| ทำ post-processing ก่อนโมเดลยังไม่ดี | ล็อก silhouette จรวดก่อนค่อย bloom |
| Scroll ผูก GSAP ทั้งหน้า หนัก/พัง mobile | scrub เฉพาะ transform 3D; DOM เล่นครั้งเดียว |
| รูป gen วุ่น แปลง 3D ไม่สวย | รูป object เดียว พื้นเรียบ มุม 3/4 |
| Scope บวม (ทั้งร้าน + splat + shop) | ตัดที่ Definition of Done v1 |
| License GSAP plugins | SplitText ใช้เมื่อมี Club; ไม่งั้นทางเลือกฟรี |

---

## 14. เอกสารอ้างอิงใน repo

| ไฟล์ | ใช้ทำอะไร |
|------|-----------|
| `docs/oryzo-ai-tech-stack.md` | ทำไมเลือก stack / ลายเซ็น production ของ Lusion |
| `docs/ROCKET-BUILD-GUIDE.md` (ไฟล์นี้) | ขั้นตอนทำเว็บขายจรวดตั้งแต่ setup ถึง ship |

---

## 15. ขั้นถัดไปหลังอ่านจบ

เลือกอย่างใดอย่างหนึ่งแล้วลงมือ:

1. **Phase 1 ทันที** — scaffold Astro + shell  
2. **Asset ก่อน** — gen รูปจรวด + img2threejs  
3. **ขยาย brief** — ชื่อแบรนด์ รุ่น ราคา โทนภาษา  

แนะนำ: ทำ (1) กับ (2) คู่กัน — shell นิ่ง + มีจรวด 1 ชิ้นใน canvas ภายในไม่กี่วัน

---

*สไตล์และสถาปัตยกรรมอ้างอิง reverse-engineering ใน `oryzo-ai-tech-stack.md` (Oryzo / Lusion). โปรเจกต์นี้ใช้ practical stack ที่ใกล้เคียงและ maintain ได้โดยทีมเล็ก.*
