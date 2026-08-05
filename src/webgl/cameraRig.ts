import * as THREE from "three";
import { landingFromSection } from "./landingProgress";

export type CamKey = {
  t: number;
  pos: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

function smootherstep(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function sampleCamKeys(
  keys: CamKey[],
  t: number,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
): number | undefined {
  if (keys.length === 0) return undefined;
  if (keys.length === 1) {
    outPos.fromArray(keys[0].pos);
    outTarget.fromArray(keys[0].target);
    return keys[0].fov;
  }

  const p = THREE.MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].t) i += 1;

  const a = keys[i];
  const b = keys[i + 1];
  const span = Math.max(b.t - a.t, 1e-5);
  const u = smootherstep((p - a.t) / span);

  outPos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], u),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], u),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], u),
  );
  outTarget.set(
    THREE.MathUtils.lerp(a.target[0], b.target[0], u),
    THREE.MathUtils.lerp(a.target[1], b.target[1], u),
    THREE.MathUtils.lerp(a.target[2], b.target[2], u),
  );

  if (a.fov != null && b.fov != null) {
    return THREE.MathUtils.lerp(a.fov, b.fov, u);
  }
  return b.fov ?? a.fov;
}

/**
 * Landing-aware camera: tracks descent altitude & circles in for touchdown product shot.
 * Keys use local section t but are authored as continuous descent beats.
 */
export function buildSectionKeys(mobile: boolean): Record<string, CamKey[]> {
  if (mobile) {
    return {
      hero: [
        { t: 0, pos: [0, 1.4, 13.5], target: [0, 1.1, 0], fov: 40 },
        { t: 1, pos: [0.1, 1.15, 12.6], target: [0, 0.85, 0], fov: 38 },
      ],
      systems: [
        { t: 0, pos: [0.15, 1.0, 12.4], target: [0, 0.7, 0], fov: 37 },
        { t: 1, pos: [0.25, 0.55, 11.6], target: [0, 0.25, 0], fov: 36 },
      ],
      variants: [
        { t: 0, pos: [0.2, 0.45, 11.8], target: [0, 0.15, 0], fov: 36 },
        { t: 1, pos: [0.1, 0.15, 12.0], target: [0, -0.05, 0], fov: 36 },
      ],
      specs: [
        { t: 0, pos: [0.15, 0.1, 11.8], target: [0, -0.1, 0], fov: 35 },
        { t: 1, pos: [0.25, -0.05, 11.2], target: [0, -0.25, 0], fov: 34 },
      ],
      reel: [
        { t: 0, pos: [0.15, -0.05, 11.4], target: [0, -0.3, 0], fov: 35 },
        { t: 1, pos: [0.05, -0.12, 11.8], target: [0, -0.35, 0], fov: 36 },
      ],
      order: [
        { t: 0, pos: [0.1, -0.08, 11.6], target: [0, -0.35, 0], fov: 36 },
        { t: 1, pos: [0, -0.05, 11.2], target: [0, -0.4, 0], fov: 34 },
      ],
      footer: [
        { t: 0, pos: [0, -0.05, 11.2], target: [0, -0.4, 0], fov: 34 },
        { t: 1, pos: [0, -0.08, 11.5], target: [0, -0.42, 0], fov: 35 },
      ],
    };
  }

  return {
    hero: [
      { t: 0, pos: [0.4, 1.85, 10.8], target: [0.55, 1.7, 0], fov: 34 },
      { t: 0.5, pos: [0.7, 1.55, 9.6], target: [0.5, 1.35, 0], fov: 32 },
      { t: 1, pos: [0.9, 1.25, 8.8], target: [0.45, 1.05, 0], fov: 30 },
    ],
    systems: [
      { t: 0, pos: [0.85, 1.15, 8.7], target: [0.45, 0.9, 0], fov: 30 },
      { t: 0.45, pos: [1.35, 0.75, 7.4], target: [0.35, 0.45, 0], fov: 28 },
      { t: 1, pos: [1.5, 0.45, 6.8], target: [0.3, 0.15, 0], fov: 27 },
    ],
    variants: [
      { t: 0, pos: [1.2, 0.4, 7.2], target: [0.4, 0.1, 0], fov: 29 },
      { t: 0.5, pos: [0.4, 0.2, 7.6], target: [0.5, -0.05, 0], fov: 30 },
      { t: 1, pos: [-0.35, 0.05, 7.4], target: [0.45, -0.15, 0], fov: 29 },
    ],
    specs: [
      { t: 0, pos: [0.2, 0.05, 7.6], target: [0.45, -0.15, 0], fov: 30 },
      { t: 0.55, pos: [1.1, -0.05, 6.4], target: [0.35, -0.25, 0], fov: 27 },
      { t: 1, pos: [1.35, -0.15, 5.9], target: [0.25, -0.32, 0], fov: 26 },
    ],
    reel: [
      { t: 0, pos: [0.9, -0.1, 6.6], target: [0.4, -0.3, 0], fov: 29 },
      { t: 1, pos: [0.55, -0.12, 7.0], target: [0.5, -0.35, 0], fov: 30 },
    ],
    order: [
      { t: 0, pos: [0.5, -0.08, 7.0], target: [0.5, -0.35, 0], fov: 30 },
      { t: 0.5, pos: [0.85, 0.05, 6.4], target: [0.45, -0.35, 0], fov: 28 },
      { t: 1, pos: [1.05, 0.15, 5.9], target: [0.4, -0.38, 0], fov: 27 },
    ],
    footer: [
      { t: 0, pos: [1.0, 0.12, 6.0], target: [0.4, -0.38, 0], fov: 27 },
      { t: 1, pos: [0.9, 0.1, 6.3], target: [0.45, -0.4, 0], fov: 28 },
    ],
  };
}

/** Optional: blend camera look toward rocket altitude from landing */
export function applyLandingCameraBias(
  sectionId: string,
  localT: number,
  mobile: boolean,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3,
) {
  const L = landingFromSection(sectionId, localT);
  // pull target Y with rocket altitude so framing tracks descent
  const trackY = THREE.MathUtils.lerp(
    mobile ? 1.0 : 1.6,
    mobile ? -0.35 : -0.32,
    smootherstep(L),
  );
  outTarget.y = THREE.MathUtils.lerp(outTarget.y, trackY, 0.65);
  // camera a bit lower as we land
  const camY = THREE.MathUtils.lerp(
    outPos.y,
    THREE.MathUtils.lerp(mobile ? 1.2 : 1.7, mobile ? -0.05 : 0.12, L),
    0.35,
  );
  outPos.y = camY;
}

export { smootherstep };
