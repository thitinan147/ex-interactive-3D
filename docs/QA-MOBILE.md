# Mobile QA checklist — Vektor V-9

**สถานะ:** automated viewport QA (Playwright) ผ่าน · **มือถือจริงยังต้องลองบนเครื่องคุณ**

Local URL: `http://127.0.0.1:4321/`  
(เครื่องจริงใน LAN: `http://<your-mac-ip>:4321/` หลัง `npm run dev -- --host 0.0.0.0`)

---

## Automated results (2026-08-06)

Viewport จำลอง **iPhone 14-ish 390×844**

| Check | Result |
|-------|--------|
| Preloader ปิด + `aria-busy=false` | ✅ |
| WebGL canvas + mobile MQ | ✅ |
| Hero title visible (opacity 1) | ✅ |
| ไม่มี horizontal overflow | ✅ |
| rAF ~1s (desktop GPU emulating phone) | ~60 fps ✅ |
| Form demo submit → success message | ✅ |
| Console **errors** | 0 |
| Console warnings (fixed in code) | THREE.Clock / PCFSoft deprecated → แก้เป็น Timer + PCFShadowMap |

Screenshot: hero text อยู่ใน scrim อ่านได้, จรวดอยู่ด้านล่างฉาก

---

## มือถือจริง — checklist (ทำบน iPhone / Android)

### เตรียม

1. Mac กับ phone เครือข่าย Wi‑Fi เดียวกัน  
2. `npm run dev -- --host 0.0.0.0 --port 4321`  
3. เปิด `http://<LAN-IP>:4321` บน Safari / Chrome  
4. (iOS) ถ้าโหลดไม่ได้: อนุญาต local network / ปิด VPN

### Preloader

- [ ] เห็น brand + bar + %  
- [ ] หายภายใน ~1–2 วินาที ไม่ค้าง  
- [ ] หลังจบ เลื่อนหน้าได้

### Hero / text

- [ ] หัวข้ออ่านชัด (scrim) ไม่ถูกจรวดทับจนอ่านไม่ออก  
- [ ] ปุ่ม Join / Watch กดได้  
- [ ] ไม่มี scroll แนวนอน

### 3D / FPS

- [ ] จรวดโผล่หลัง preloader  
- [ ] หมุน/scroll ลื่นพอใช้ (เป้า mid-tier ≥ ~30 fps)  
- [ ] สลับ tab ออก-กลับ แล้วไม่ค้าง

### Scroll sections

- [ ] Systems explode  
- [ ] Variants เปลี่ยนสีเมื่อแตะการ์ด  
- [ ] Specs / Reel / Order ถึงได้

### Form

- [ ] โฟกัส email แล้ว keyboard ไม่บังปุ่มจนใช้ไม่ได้ (scroll ได้)  
- [ ] Submit demo โชว์ success  
- [ ] (ถ้ามี Formspree) เข้า inbox จริง

### Safari quirks (iOS)

- [ ] `100svh` / address bar โชว์-ซ่อน ไม่พัง layout ร้ายแรง  
- [ ] หมุน landscape แล้วยังใช้ได้ (พอทน)  
- [ ] ไม่มี soft-reload ขาวจอดนาน

---

## Bugs found & fixed (session นี้)

| ID | Issue | Fix |
|----|--------|-----|
| M1 | `THREE.Clock` deprecated warning | ใช้ `THREE.Timer` + `connect(document)` |
| M2 | `PCFSoftShadowMap` deprecated warning | ใช้ `PCFShadowMap` เฉพาะตอน shadow เปิด |

## Known / not blocking

| Item | Notes |
|------|--------|
| Formspree | demo mode จนกว่าจะตั้ง env |
| Deploy | local only — ดู `DEPLOY.md` |
| Real-device FPS | ต้องวัดบน GPU มือถือจริง (emulation ≠ เครื่องจริง) |
| Landscape | รองรับพื้นฐาน ยังไม่ polish เต็ม |

---

## Sign-off

| Role | Device | Date | Pass? | Notes |
|------|--------|------|-------|-------|
| Automated | Playwright 390×844 | 2026-08-06 | ✅ | ดูตารางบน |
| Human | iPhone __ | | | |
| Human | Android __ | | | |
