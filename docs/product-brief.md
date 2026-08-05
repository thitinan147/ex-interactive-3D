# Product brief — Vektor V-9

| Field | Value |
|-------|--------|
| Brand | Vektor Systems |
| Model | V-9 |
| Category | Reusable medium-lift orbital rocket |
| CTA | Waitlist / pre-order (no checkout in v1) |
| Tone | Serious aerospace product marketing |
| Language | English (UI); docs may be Thai |
| Variants | Standard · Heavy · Reusable |

## Tagline

The rocket built for the next decade of launch.

## Primary offers

1. Cadence-ready reusable first stage  
2. Transparent open specs for program planning  
3. Configurable flight kits (Standard / Heavy / Reusable)

## Site sections

hero → systems → variants → specs → reel → order → footer

## 3D rocket

| Item | Path |
|------|------|
| Reference image (Grok gen) | `public/images/reference/rocket-v9.jpg` |
| Analysis + pipeline state | `.img2threejs/` |
| Runtime model (code sculpt) | `src/webgl/models/createRocketModel.ts` |

Reconstruction is **code-only** from the reference (img2threejs methodology): ogive white stack, hex TPS skirt, grid fins, landing legs, copper engine cluster. Variants recolor body/TPS; systems scroll explodes assemblies.
