# ยกระดับ Vektor → ระดับ ORYZO — วิเคราะห์จาก skill ในเครื่อง

วันที่: 2026-08-06  
อ้างอิง: `docs/oryzo-ai-tech-stack.md` + skill ที่ติดตั้งในเครื่อง + codebase ปัจจุบัน

> **นิยาม “ระดับ ORYZO”** ที่ใช้ในเอกสารนี้  
> ไม่ใช่ clone ฟีเจอร์ Lusion ทุกตัว (SOG / `.buf` / fork Three)  
> แต่คือ **ความรู้สึก agency-grade**: 3D กับ DOM เป็นเรื่องเดียวกัน, scroll คุมฉากแน่น, type/motion editorial, โหลด/preloader ออกแบบมา, mobile ลงตัว, รายละเอียด render ที่ “แพง”

---

## 1. สิ่งที่เรามีแล้ว (ฐานถูกทาง — เหมือน ORYZO)

| ชั้น ORYZO | Vektor ตอนนี้ | Skill ที่รองรับ |
|------------|---------------|-----------------|
| Astro static shell | ✅ | `astro` |
| Vanilla JS + canvas ทับ DOM | ✅ | `3d-web-experience`, `threejs-fundamentals` |
| Three.js WebGL | ✅ r185 | `threejs-*` |
| Custom scroll director (ไม่ใช้ ScrollTrigger) | ✅ `ScrollDirector` | `3d-web-experience` (scroll-driven 3D) |
| GSAP text/UI motion | ✅ partial | `gsap-core`, `gsap-timeline` |
| Section story (hero → systems → …) | ✅ | `brainstorming` / product brief |
| Video overlay | ✅ local Grok reel | `imagine` |
| Preloader | ✅ | `gsap-core` |
| Mobile / perf baseline | ✅ code-split, low quality | `3d-web-experience` perf |
| Design tokens + Literata / DM Mono | ✅ แนว editorial | `high-end-visual-design` (บางส่วน) |

**สรุป:** โครงกระดูก ORYZO มีแล้ว (~40–50% ของ “ความรู้สึก”) — ช่องว่างอยู่ที่ **ความลึกของฉาก, ความละเอียดของ motion, และ polish ชั้น render/UI**

---

## 2. ช่องว่างหลัก (ORYZO มี / เรายังบาง)

จัดตาม impact × skill ที่มีในเครื่อง

### P0 — ช่องว่างที่ทำให้ “ยังไม่ใช่ Lusion” ชัดสุด

| Gap | ORYZO | Vektor | Skill ในเครื่องที่ชี้นำ | งานที่ต้องทำ |
|-----|-------|--------|-------------------------|--------------|
| **Scroll ↔ 3D แน่น** | custom `Scroll` + camera paths + section timelines | progress แบบ lerp ง่าย, keyframe น้อย | `3d-web-experience`, `gsap-timeline` | scrub camera/rocket ด้วย curve หลายจุดต่อ section; ซิงก์ DOM active state ละเอียดขึ้น |
| **Typography motion** | GSAP **SplitText** หนาแน่น | fade+y ทั้งบล็อก | `gsap-plugins`, `gsap-core` | line/word split reveal (SplitType ฟรีถ้าไม่มี Club) |
| **Hero interaction** | hover AI / pointer บน object | idle spin อย่างเดียว | `threejs-fundamentals`, `3d-web-experience` | raycast hover, highlight part, cursor state |
| **Post-processing** | TAA/FXAA/SMAA, Bloom, LUT, SSR… | ACES + lights อย่างเดียว | `threejs-postprocessing` | เริ่ม: FXAA + mild Bloom + color grade; mobile ปิด |
| **Preloader as experience** | canvas intro แยก | DOM bar อย่างเดียว | `gsap-timeline`, `threejs-fundamentals` | preloader 3D เล็ก / progress ผูก asset load จริง |
| **Visual craft UI** | design system หนา (~90 tokens), grid editorial | tokens พื้นฐาน, card เรียบ | `high-end-visual-design`, `impeccable`, `frontend-design` | double-bezel cards, island nav, spacing หายใจ, micro-hover |
| **Asset realism** | `.buf` + PBR packs + env RGBM | procedural rocket + RoomEnvironment | `img2threejs`, `threejs-loaders`, `imagine` | glTF high-poly หรือ refine sculpt + baked textures |

### P1 — ชั้น “หนังยาว / หลายฉาก”

| Gap | ORYZO | Vektor | Skill | งาน |
|-----|-------|--------|-------|-----|
| หลาย WebGL scenes | Hero, Table, Wearable, Stack… | HeroScene เดียว | `3d-web-experience` | อย่างน้อย 2 โหมด: Hero stack vs Exploded/Systems focus |
| Gaussian splats | SOG + worker | ไม่มี | (ไม่มี skill SOG โดยตรง) | **ข้าม v1.5** หรือทำทีหลังด้วย loader ภายนอก |
| Rive motion bits | `/rive/oryzo.riv` | ไม่มี | — | optional 2D stamps / gauges |
| Audio | Web Audio + interaction | ไม่มี | — | whoosh เบา + mute default |
| WebGL text (MSDF) | Inter MSDF | DOM only | `threejs-shaders` / custom | optional labels ใน 3D |
| Custom shaders | glslify + Lusion FBO | standard materials | `threejs-shaders` | heat haze, engine glow sprite, film grain full-screen |

### P2 — Delivery / โปรดักชัน (ORYZO บน edge)

| Gap | Skill / docs | หมายเหตุ |
|-----|--------------|----------|
| Cloudflare Pages + Insights | `astro` + `docs/DEPLOY.md` | ยัง local-only โดยตั้งใจ |
| Real newsletter | Formspree env | demo mode |
| Real device QA sign-off | `playwright-best-practices`, `docs/QA-MOBILE.md` | automated ผ่านแล้ว |

---

## 3. Skill → บทบาทใน roadmap (ใคร “เป็นหัวหน้า” ตอนไหน)

```
[Vision / craft]
  high-end-visual-design  ──┐
  impeccable              ──┼── UI/type/spacing/micro-interaction ระดับ agency
  frontend-design         ──┘

[3D experience]
  3d-web-experience       ── โครง scene, scroll-3D, perf budget
  threejs-fundamentals   ── camera/renderer hygiene
  threejs-postprocessing  ── bloom / AA / grade
  threejs-shaders         ── เอฟเฟกต์เฉพาะ
  threejs-loaders         ── glTF pipeline
  img2threejs + imagine   ── hero prop fidelity + reel frames

[Motion]
  gsap-core / timeline    ── preloader, split text, section enter
  gsap-plugins            ── SplitText, Flip (ถ้า license)
  gsap-framer-scroll…     ── ใช้แนวคิด scrub; **อย่าบังคับ ScrollTrigger**
                            (ORYZO เองก็ไม่ใช้ — เก็บ custom director)

[Quality]
  accessibility           ── reduced-motion, focus, canvas a11y
  modern-web-guidance     ── CSS/DOM patterns ปัจจุบัน
  playwright-best…        ── regression mobile
  check-work / review     ── ก่อน claim “ORYZO-level”
  ponytail                 ── กัน overbuild (ไม่ทำ SOG ก่อน hero แน่น)
```

**กฎสำคัญจาก skill + ORYZO ตรงกัน**

1. **อย่าใส่ ScrollTrigger แค่เพราะ skill มี** — ORYZO ใช้ custom scroll; เราทำ director ให้ “แน่น” ดีกว่า  
2. **อย่ากระโดดไป splat/SSR ก่อน** — `ponytail` + gap P0 ก่อน  
3. **Animate แค่ transform/opacity** — `high-end-visual-design` + `gsap-*`  
4. **Mobile budget แยก** — `3d-web-experience` (มี low path แล้ว; ต้องรักษา)

---

## 4. Gap score (คร่าวๆ)

| มิติ | ORYZO | Vektor | ช่องว่าง |
|------|-------|--------|----------|
| Architecture fit | 10 | 8 | เล็ก |
| 3D visual fidelity | 10 | 5 | ใหญ่ |
| Scroll–3D choreography | 10 | 4 | ใหญ่ |
| Typography / UI motion | 10 | 5 | กลาง–ใหญ่ |
| Multi-scene richness | 10 | 3 | ใหญ่ (ทำทีหลังได้) |
| Post / look-dev | 10 | 3 | ใหญ่ |
| Sound | 8 | 0 | กลาง |
| Delivery polish | 10 | 4 | deploy ทีหลัง |
| **Overall “feel”** | **10** | **~5** | |

เป้า realistic **v1.5 ORYZO-feel ≈ 7.5–8** โดยไม่ทำ SOG / custom binary

---

## 5. Roadmap ยกระดับ (เรียง skill-driven)

### Phase A — “แน่นเหมือนหนัง” (1–2 สัปดาห์) → เป้า ~6.5–7

| # | งาน | Skill นำ |
|---|-----|----------|
| A1 | Camera + explode **keyframes หลายจุด** ต่อ section (ease curves) | `3d-web-experience`, `gsap-timeline` |
| A2 | Split text reveal (lines/words) + stagger editorial | `gsap-plugins` / SplitType |
| A3 | Pointer hover บนจรวด (highlight part, cursor) | `threejs-fundamentals` |
| A4 | EffectComposer: **Bloom + FXAA** (desktop only) | `threejs-postprocessing` |
| A5 | UI craft: island header, feature list double-bezel, CTA micro-motion | `high-end-visual-design`, `impeccable` |
| A6 | Preloader: progress จริง + short 3D/GSAP exit ดีขึ้น | `gsap-timeline` |

### Phase B — “ฉากมีชีวิต” (1–2 สัปดาห์) → เป้า ~7.5–8

| # | งาน | Skill นำ |
|---|-----|----------|
| B1 | แยก scene mode: Hero vs Systems (lighting/camera sets) | `3d-web-experience` |
| B2 | glTF หรือ img2threejs pass ลึกขึ้น + baked textures | `threejs-loaders`, `img2threejs`, `imagine` |
| B3 | Engine glow / heat haze (shader หรือ sprites) | `threejs-shaders` |
| B4 | Web Audio: whoosh + mute | — (implement ตรง) |
| B5 | Film grain overlay fixed (CSS/canvas) | `high-end-visual-design` |
| B6 | a11y pass + Playwright smoke suite | `accessibility`, `playwright-best-practices` |

### Phase C — “Lusion-adjacent” (optional / หลัง ship)

| # | งาน | หมายเหตุ |
|---|-----|----------|
| C1 | Rive micro-graphics | ต้อง designer + runtime |
| C2 | SOG / splat desk | ต้นทุนสูง — ข้ามถ้าไม่จำเป็น |
| C3 | Custom FBO / TAA / SSR full | ใช้ `threejs-postprocessing` ทีละตัว |
| C4 | Cloudflare + real Formspree + CF beacon | `docs/DEPLOY.md` |

---

## 6. สิ่งที่ **ไม่** ควรทำเพื่อ “ให้เหมือน ORYZO”

| อย่า | ทำไม |
|------|------|
| ย้ายไป R3F/Next | ORYZO = vanilla + Astro อยู่แล้ว — เราถูกทาง |
| ใส่ ScrollTrigger ทั้งหน้า | ขัด architecture ORYZO + skill scroll แค่ “ทางเลือก” |
| ทำ SOG ก่อน A1–A5 | `ponytail`: ไม่เพิ่ม fidelity รับรู้ก่อน choreography |
| Tailwind เต็มหน้า | ORYZO custom tokens — เราทำ tokens อยู่แล้ว ขยายต่อ |
| Clone satire copy 1:1 | โปรเจกต์เราคือขายจรวด — ยกระดับ **craft** ไม่ใช่ meme |

---

## 7. Definition of “ORYZO-level v1.5” (สำหรับ Vektor)

ถือว่าผ่านเมื่อ:

1. เลื่อนทั้งหน้าแล้ว **กล้อง/จรวดรู้สึกถูกกำกับ** ไม่ใช่แค่หมุน  
2. ตัวอักษร **split reveal** แนว editorial อย่างน้อย hero + 2 sections  
3. Desktop มี **bloom/AA + grade** ชัดตา (mobile ปิด)  
4. Hover/interaction บน 3D อย่างน้อย 1 อย่างที่จำได้  
5. UI ไม่รู้สึก template (spacing, buttons, cards ผ่าน checklist `high-end-visual-design`)  
6. 30fps+ บนมือถือ mid-tier ยังอยู่  
7. (Optional) deploy public URL  

---

## 8. ขั้นถัดไปที่แนะนำทันที

**Phase A (A1–A6) implemented in codebase** — camera keyframes, split text, bloom/FXAA, hover, UI craft, preloader mark.

Next: real-device QA → optional Phase B → deploy.

---

*เอกสารนี้อัปเดตเมื่อ roadmap เปลี่ยน — ใช้คู่กับ `ROCKET-BUILD-GUIDE.md` และ `oryzo-ai-tech-stack.md`*
