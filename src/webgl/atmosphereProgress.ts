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
  keyColor: THREE.Color;
  ambientColor: THREE.Color;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  exposure: number;
  envIntensity: number;
  cssBg: string;
};

const C_SPACE = new THREE.Color(0x05060a);
const C_REENTRY = new THREE.Color(0x1a2230);
const C_SKY = new THREE.Color(0x5a7a98);
const C_MARINE = new THREE.Color(0x1e4554);
const C_CLEAR_SKY = new THREE.Color(0x3a5a78);
const C_CLEAR_OCEAN = new THREE.Color(0x2a5068);

const C_KEY_SPACE = new THREE.Color(0xd8e4f0);
const C_KEY_SKY = new THREE.Color(0xe8e6e0);
const C_KEY_OCEAN = new THREE.Color(0xfff2e4);
const C_AMB_SPACE = new THREE.Color(0x9aa4b0);
const C_AMB_SKY = new THREE.Color(0xa8b0b8);
const C_AMB_OCEAN = new THREE.Color(0xb0bcc4);

const _fog = new THREE.Color();
const _clear = new THREE.Color();
const _hemiSky = new THREE.Color();
const _hemiGnd = new THREE.Color();
const _keyColor = new THREE.Color();
const _ambColor = new THREE.Color();

export function envFromLanding(L: number, mobile: boolean): EnvPhase {
  const t = THREE.MathUtils.clamp(L, 0, 1);

  const space = 1 - THREE.MathUtils.smoothstep(t, 0.08, 0.38);
  // Sky peaks mid-descent then yields to clear ocean air
  const sky =
    THREE.MathUtils.smoothstep(t, 0.12, 0.4) *
    (1 - THREE.MathUtils.smoothstep(t, 0.68, 0.92));
  const ocean = THREE.MathUtils.smoothstep(t, 0.42, 0.82);
  const stars = 1 - THREE.MathUtils.smoothstep(t, 0.1, 0.42);

  if (t < 0.35) {
    const u = THREE.MathUtils.smoothstep(t, 0.1, 0.35);
    _fog.copy(C_SPACE).lerp(C_REENTRY, u);
  } else if (t < 0.72) {
    const u = THREE.MathUtils.smoothstep(t, 0.35, 0.72);
    _fog.copy(C_REENTRY).lerp(C_SKY, u);
  } else {
    const u = THREE.MathUtils.smoothstep(t, 0.72, 1);
    _fog.copy(C_SKY).lerp(C_MARINE, u);
  }

  // Dense vacuum early; open hard for ocean so pad/water stay crisp
  const fogBase = mobile ? 0.02 : 0.014;
  const fogOpen = mobile ? 0.004 : 0.0022;
  const fogDensity = THREE.MathUtils.lerp(
    fogBase,
    fogOpen,
    sky * 0.25 + ocean * 0.9,
  );

  _clear.copy(C_SPACE).lerp(C_CLEAR_SKY, sky).lerp(C_CLEAR_OCEAN, ocean * 0.7);

  _hemiSky
    .set(0x1a2030)
    .lerp(new THREE.Color(0xb8c8d8), sky)
    .lerp(new THREE.Color(0xc8d8e4), ocean);
  _hemiGnd
    .set(0x08090c)
    .lerp(new THREE.Color(0x2a3840), sky)
    .lerp(new THREE.Color(0x0e3040), ocean);

  // Product-readable stack in vacuum; daylight punch on pad
  const ambient = THREE.MathUtils.lerp(
    mobile ? 0.3 : 0.24,
    mobile ? 0.4 : 0.34,
    sky * 0.45 + ocean * 0.55,
  );
  const key = THREE.MathUtils.lerp(
    mobile ? 1.02 : 1.08,
    mobile ? 1.12 : 1.18,
    ocean,
  );
  const hemiIntensity = THREE.MathUtils.lerp(
    0.1,
    0.32,
    sky * 0.4 + ocean * 0.6,
  );
  const exposure = THREE.MathUtils.lerp(
    mobile ? 0.96 : 0.92,
    mobile ? 1.0 : 0.96,
    ocean,
  );
  const envIntensity = THREE.MathUtils.lerp(0.32, 0.42, ocean);

  _keyColor
    .copy(C_KEY_SPACE)
    .lerp(C_KEY_SKY, sky)
    .lerp(C_KEY_OCEAN, ocean);
  _ambColor
    .copy(C_AMB_SPACE)
    .lerp(C_AMB_SKY, sky)
    .lerp(C_AMB_OCEAN, ocean);

  const cssBg =
    ocean > 0.55
      ? `linear-gradient(180deg, #3a5a72 0%, #1e4554 40%, #0a2834 78%, #061820 100%)`
      : sky > 0.35
        ? `linear-gradient(180deg, #121820 0%, #2a4058 52%, #3a5a78 100%)`
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
    keyColor: _keyColor.clone(),
    ambientColor: _ambColor.clone(),
    hemiSky: _hemiSky.clone(),
    hemiGround: _hemiGnd.clone(),
    hemiIntensity,
    exposure,
    envIntensity,
    cssBg,
  };
}
