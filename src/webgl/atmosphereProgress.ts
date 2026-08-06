import * as THREE from "three";

/**
 * Falcon-9 / ASDS-style descent environment phases (ref: SpaceX webcast landings).
 * L 0 = high approach (black space) → reentry sky → terminal ocean droneship.
 */
export type EnvPhase = {
  space: number;
  sky: number;
  ocean: number;
  stars: number;
  fogColor: THREE.Color;
  fogDensity: number;
  clearColor: THREE.Color;
  ambient: number;
  key: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  exposure: number;
  cssBg: string;
};

const C_SPACE = new THREE.Color(0x05060a);
const C_REENTRY = new THREE.Color(0x1a2230);
const C_SKY = new THREE.Color(0x6b8fa8);
const C_HORIZON = new THREE.Color(0x9bb0c0);
const C_MARINE = new THREE.Color(0x7a96a6);
const C_CLEAR_SKY = new THREE.Color(0x4a6d88);
const C_CLEAR_OCEAN = new THREE.Color(0x5a7a90);

const _fog = new THREE.Color();
const _clear = new THREE.Color();
const _hemiSky = new THREE.Color();
const _hemiGnd = new THREE.Color();

export function envFromLanding(L: number, mobile: boolean): EnvPhase {
  const t = THREE.MathUtils.clamp(L, 0, 1);

  // Space dominates early; sky peaks mid; ocean terminal (ASDS approach)
  const space = 1 - THREE.MathUtils.smoothstep(t, 0.08, 0.38);
  const sky = THREE.MathUtils.smoothstep(t, 0.12, 0.4) * (1 - THREE.MathUtils.smoothstep(t, 0.72, 0.95) * 0.15);
  const ocean = THREE.MathUtils.smoothstep(t, 0.42, 0.82);
  const stars = 1 - THREE.MathUtils.smoothstep(t, 0.1, 0.42);

  // Fog: black vacuum → atmospheric blue → marine haze
  if (t < 0.35) {
    const u = THREE.MathUtils.smoothstep(t, 0.1, 0.35);
    _fog.copy(C_SPACE).lerp(C_REENTRY, u);
  } else if (t < 0.7) {
    const u = THREE.MathUtils.smoothstep(t, 0.35, 0.7);
    _fog.copy(C_REENTRY).lerp(C_SKY, u);
  } else {
    const u = THREE.MathUtils.smoothstep(t, 0.7, 1);
    _fog.copy(C_SKY).lerp(C_MARINE, u);
  }

  const fogDensity = THREE.MathUtils.lerp(
    mobile ? 0.022 : 0.016,
    mobile ? 0.012 : 0.008,
    sky * 0.55 + ocean * 0.45,
  );

  _clear.copy(C_SPACE).lerp(C_CLEAR_SKY, sky).lerp(C_CLEAR_OCEAN, ocean * 0.65);

  _hemiSky.set(0x1a2030).lerp(new THREE.Color(0xb8c8d8), sky).lerp(new THREE.Color(0xc5d4e0), ocean);
  _hemiGnd.set(0x08090c).lerp(new THREE.Color(0x2a3840), sky).lerp(new THREE.Color(0x1a3a44), ocean);

  const ambient = THREE.MathUtils.lerp(mobile ? 0.22 : 0.14, mobile ? 0.38 : 0.32, sky * 0.5 + ocean * 0.5);
  const key = THREE.MathUtils.lerp(mobile ? 0.85 : 0.9, mobile ? 1.05 : 1.12, ocean);
  const hemiIntensity = THREE.MathUtils.lerp(0.06, 0.28, sky * 0.4 + ocean * 0.6);
  const exposure = THREE.MathUtils.lerp(mobile ? 0.88 : 0.8, mobile ? 0.98 : 0.92, ocean);

  // CSS page bg tracks the same story (canvas is transparent)
  const cssBg =
    ocean > 0.55
      ? `linear-gradient(180deg, #4a6d88 0%, #5a7a90 42%, #0d3a48 100%)`
      : sky > 0.35
        ? `linear-gradient(180deg, #1a2230 0%, #3a5068 55%, #4a6d88 100%)`
        : `#05060a`;

  return {
    space,
    sky,
    ocean,
    stars,
    fogColor: _fog.clone(),
    fogDensity,
    clearColor: _clear.clone(),
    ambient,
    key,
    hemiSky: _hemiSky.clone(),
    hemiGround: _hemiGnd.clone(),
    hemiIntensity,
    exposure,
    cssBg,
  };
}
