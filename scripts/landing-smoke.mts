/**
 * Smoke-test real landingProgress helpers (shipped source).
 * Run: npx tsx scripts/landing-smoke.mts
 */
import {
  altitudeY,
  engineBurnFromLanding,
  landingFromSection,
  legsFromLanding,
} from "../src/webgl/landingProgress.ts";

const lines: string[] = [];
const log = (s: string) => {
  lines.push(s);
  console.log(s);
};

const sections = [
  "hero",
  "systems",
  "variants",
  "specs",
  "reel",
  "order",
  "footer",
] as const;

const landings: number[] = [];
for (const id of sections) {
  const L0 = landingFromSection(id, 0);
  const L1 = landingFromSection(id, 1);
  landings.push(L0, L1);
  log(`${id}: t0=${L0.toFixed(4)} t1=${L1.toFixed(4)}`);
  if (L1 + 1e-9 < L0) {
    throw new Error(`${id}: landing must not decrease within section`);
  }
}

for (let i = 1; i < landings.length; i++) {
  if (landings[i] + 1e-9 < landings[i - 1]) {
    throw new Error(
      `global landing not monotonic at sample ${i}: ${landings[i - 1]} -> ${landings[i]}`,
    );
  }
}

const gear0 = legsFromLanding(0);
const gearMid = legsFromLanding(0.3);
const gear1 = legsFromLanding(1);
log(`legs: 0=${gear0.toFixed(4)} mid=${gearMid.toFixed(4)} 1=${gear1.toFixed(4)}`);
if (!(gear0 < gearMid && gearMid <= gear1 + 1e-9)) {
  throw new Error("legs deploy curve must increase from stowed to out");
}
if (gear0 > 0.05) throw new Error("legs should start near stowed");
if (gear1 < 0.95) throw new Error("legs should be fully out at landing=1");

const burns = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1].map((L) => ({
  L,
  b: engineBurnFromLanding(L),
}));
log(`burn samples: ${burns.map((x) => `${x.L}:${x.b.toFixed(3)}`).join(" ")}`);
const unique = new Set(burns.map((x) => x.b.toFixed(4)));
if (unique.size < 3) throw new Error("engine burn must vary across descent");
if (engineBurnFromLanding(1) >= engineBurnFromLanding(0.5)) {
  throw new Error("engine burn should die down by touchdown vs mid-descent");
}

const y0 = altitudeY(0, false);
const y1 = altitudeY(1, false);
log(`altitude desktop: high=${y0.toFixed(3)} landed=${y1.toFixed(3)}`);
if (!(y1 < y0)) throw new Error("altitude must decrease with landing progress");

const { envFromLanding } = await import("../src/webgl/atmosphereProgress.ts");
const e0 = envFromLanding(0, false);
const eMid = envFromLanding(0.35, false);
const e1 = envFromLanding(1, false);
log(
  `env: L0 stars=${e0.stars.toFixed(2)} sky=${e0.sky.toFixed(2)} ocean=${e0.ocean.toFixed(2)}`,
);
log(
  `env: L0.35 stars=${eMid.stars.toFixed(2)} sky=${eMid.sky.toFixed(2)} ocean=${eMid.ocean.toFixed(2)}`,
);
log(
  `env: L1 stars=${e1.stars.toFixed(2)} sky=${e1.sky.toFixed(2)} ocean=${e1.ocean.toFixed(2)}`,
);
if (!(e0.stars > 0.8 && e0.ocean < 0.05)) {
  throw new Error("start should be space-dominant");
}
if (!(eMid.sky > 0.4 && eMid.stars < 0.6)) {
  throw new Error("mid should show sky over space");
}
if (!(e1.ocean > 0.9 && e1.stars < 0.1)) {
  throw new Error("end should be ocean/pad dominant");
}

log("OK landing-smoke passed");

const outPath = process.env.LANDING_SMOKE_OUT;
if (outPath) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
}
