import * as THREE from "three";
import { smootherstep } from "./cameraRig";

/** Global landing 0 = high approach, 1 = touchdown on pad */
const RANGES: Record<string, [number, number]> = {
  hero: [0.0, 0.14],
  systems: [0.14, 0.36],
  variants: [0.36, 0.55],
  specs: [0.55, 0.74],
  reel: [0.74, 0.88],
  order: [0.88, 1.0],
  footer: [1.0, 1.0],
};

export function landingFromSection(sectionId: string, localT: number): number {
  const range = RANGES[sectionId] ?? RANGES.hero;
  const u = smootherstep(THREE.MathUtils.clamp(localT, 0, 1));
  return THREE.MathUtils.lerp(range[0], range[1], u);
}

/** Legs start stowed, fully out before final approach */
export function legsFromLanding(L: number): number {
  return smootherstep(THREE.MathUtils.smoothstep(L, 0.12, 0.42));
}

/** Engine burn peaks mid-descent, dies at touchdown */
export function engineBurnFromLanding(L: number): number {
  if (L < 0.08) return THREE.MathUtils.smoothstep(L, 0, 0.08) * 0.35;
  if (L < 0.85) {
    const mid = THREE.MathUtils.smoothstep(L, 0.08, 0.55);
    return 0.35 + mid * 0.55;
  }
  return THREE.MathUtils.lerp(0.9, 0.05, THREE.MathUtils.smoothstep(L, 0.85, 1));
}

/** World Y of rocket root — high → pad (scale 0.5 desktop baseline) */
export function altitudeY(L: number, mobile: boolean): number {
  const high = mobile ? 1.35 : 1.2;
  const landed = mobile ? -0.42 : -0.22;
  // ease-in near ground (suicide burn feel)
  const e = L * L * (3 - 2 * L);
  const near = THREE.MathUtils.smoothstep(L, 0.7, 1);
  const eased = THREE.MathUtils.lerp(e, e * e, near * 0.55);
  return THREE.MathUtils.lerp(high, landed, eased);
}
