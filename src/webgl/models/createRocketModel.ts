import * as THREE from "three";

export type RocketVariant = "standard" | "heavy" | "reusable";

export type RocketModel = THREE.Group & {
  setVariant: (id: RocketVariant) => void;
  setExplode: (t: number) => void;
};

const VARIANT: Record<
  RocketVariant,
  { body: number; tip: number; tps: number }
> = {
  standard: { body: 0xf4f2ed, tip: 0xc8ccd2, tps: 0x0d0f12 },
  heavy: { body: 0xd5dbe3, tip: 0xa6aeb8, tps: 0x0a0c10 },
  reusable: { body: 0xf7f5f0, tip: 0xd2d5da, tps: 0x14110f },
};

function mat(
  color: number,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.2,
    roughness: 0.45,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.8,
    ...opts,
  });
}

function hexTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1a1e24";
  ctx.fillRect(0, 0, size, size);

  const radius = size / 11;
  const h = radius * Math.sqrt(3);
  for (let row = -1; row < 16; row++) {
    for (let col = -1; col < 14; col++) {
      const x = col * radius * 1.5;
      const y = row * h + ((col & 1) * h) / 2;
      const shade = 8 + ((row * 3 + col * 5) % 7);
      ctx.fillStyle = `rgb(${shade},${shade + 1},${shade + 3})`;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ((60 * i - 30) * Math.PI) / 180;
        const px = x + Math.cos(a) * radius * 0.9;
        const py = y + Math.sin(a) * radius * 0.9;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 3);
  tex.anisotropy = 4;
  return tex;
}

function gridFin(metal: THREE.Material, dark: THREE.Material) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.02), dark);
  g.add(plate);

  const beamH = new THREE.BoxGeometry(0.42, 0.016, 0.018);
  const beamV = new THREE.BoxGeometry(0.016, 0.3, 0.018);
  for (let i = -2; i <= 2; i++) {
    const h = new THREE.Mesh(beamH, metal);
    h.position.set(0, i * 0.06, 0.016);
    g.add(h);
  }
  for (let i = -3; i <= 3; i++) {
    const v = new THREE.Mesh(beamV, metal);
    v.position.set(i * 0.055, 0, 0.016);
    g.add(v);
  }

  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), metal);
  hinge.position.set(-0.28, 0, 0);
  g.add(hinge);
  return g;
}

function landingLeg(metal: THREE.Material, dark: THREE.Material) {
  const g = new THREE.Group();
  const upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.026, 0.7, 8),
    dark,
  );
  upper.position.set(0, -0.15, 0);
  g.add(upper);

  const knee = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), metal);
  knee.position.set(0.04, -0.5, 0);
  g.add(knee);

  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.02, 0.55, 8),
    dark,
  );
  lower.position.set(0.12, -0.78, 0);
  lower.rotation.z = 0.4;
  g.add(lower);

  const brace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.42, 6),
    metal,
  );
  brace.position.set(-0.06, -0.4, 0.04);
  brace.rotation.z = -0.5;
  g.add(brace);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.13, 0.04, 16),
    metal,
  );
  pad.position.set(0.26, -1.08, 0);
  g.add(pad);
  return g;
}

function nozzle(copper: THREE.Material, dark: THREE.Material) {
  const g = new THREE.Group();
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.1, 0.3, 16, 1, true),
    copper,
  );
  bell.position.y = -0.08;
  g.add(bell);
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.07, 0.22, 12, 1, true),
    dark,
  );
  inner.position.y = -0.04;
  g.add(inner);
  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.07, 10),
    dark,
  );
  throat.position.y = 0.1;
  g.add(throat);
  return g;
}

export function createRocketModel(): RocketModel {
  const root = new THREE.Group() as RocketModel;
  root.name = "rocket";

  const bodyMat = mat(VARIANT.standard.body, {
    metalness: 0.12,
    roughness: 0.42,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
  });
  const tipMat = mat(VARIANT.standard.tip, {
    metalness: 0.9,
    roughness: 0.25,
  });
  const metalMat = mat(0xb0b7c0, { metalness: 0.85, roughness: 0.3 });
  const darkMat = mat(0x2c3138, { metalness: 0.7, roughness: 0.4 });
  const copperMat = mat(0xb87333, {
    metalness: 0.95,
    roughness: 0.28,
    clearcoat: 0.2,
  });
  const copperHot = mat(0xc45c28, {
    metalness: 0.9,
    roughness: 0.32,
    emissive: new THREE.Color(0x4a1800),
    emissiveIntensity: 0.25,
  });
  const tpsMat = mat(VARIANT.standard.tps, {
    map: hexTexture(),
    metalness: 0.45,
    roughness: 0.38,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
  });

  const body = new THREE.Group();
  body.name = "body";

  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.56, 3.4, 48),
    bodyMat,
  );
  fuselage.position.y = 0.1;
  body.add(fuselage);

  const upperTaper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.52, 0.55, 48),
    bodyMat,
  );
  upperTaper.position.y = 2.05;
  body.add(upperTaper);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.4, 40, 28), bodyMat);
  nose.scale.set(1, 1.55, 1);
  nose.position.y = 2.55;
  body.add(nose);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 16), tipMat);
  tip.scale.set(1, 1.3, 1);
  tip.position.y = 3.2;
  body.add(tip);

  for (const y of [1.6, 0.7, -0.2, -1.0]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.545, 0.008, 8, 48),
      darkMat,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    body.add(ring);
  }

  root.add(body);

  const heatShield = new THREE.Group();
  heatShield.name = "heatShield";
  const tps = new THREE.Mesh(
    new THREE.CylinderGeometry(0.57, 0.5, 1.65, 48),
    tpsMat,
  );
  tps.position.y = -1.55;
  heatShield.add(tps);
  const tpsLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.4, 0.35, 48),
    tpsMat,
  );
  tpsLower.position.y = -2.45;
  heatShield.add(tpsLower);
  root.add(heatShield);

  const gridFins = new THREE.Group();
  gridFins.name = "gridFins";
  gridFins.position.y = 1.75;
  for (let i = 0; i < 4; i++) {
    const fin = gridFin(metalMat, darkMat);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    fin.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
    fin.rotation.y = -a + Math.PI / 2;
    fin.rotation.z = 0.05;
    gridFins.add(fin);
  }
  root.add(gridFins);

  const flaps = new THREE.Group();
  flaps.name = "flaps";
  flaps.position.y = -1.05;
  for (let i = 0; i < 4; i++) {
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.2), bodyMat);
    const a = (i / 4) * Math.PI * 2;
    flap.position.set(Math.cos(a) * 0.58, 0, Math.sin(a) * 0.58);
    flap.rotation.y = -a;
    flap.rotation.z = 0.2;
    flaps.add(flap);
  }
  root.add(flaps);

  const legs = new THREE.Group();
  legs.name = "legs";
  legs.position.y = -1.7;
  for (let i = 0; i < 4; i++) {
    const leg = landingLeg(metalMat, darkMat);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    leg.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
    leg.rotation.y = -a + Math.PI / 2;
    leg.rotation.z = 0.5;
    legs.add(leg);
  }
  root.add(legs);

  const engines = new THREE.Group();
  engines.name = "engines";
  engines.position.y = -2.65;

  const skirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.1, 28),
    darkMat,
  );
  skirt.position.y = 0.14;
  engines.add(skirt);

  const nozzles: [number, number, THREE.Material][] = [
    [0, 0, copperHot],
    [0.15, 0, copperMat],
    [-0.15, 0, copperMat],
    [0.075, 0.13, copperMat],
    [-0.075, 0.13, copperMat],
    [0.075, -0.13, copperMat],
    [-0.075, -0.13, copperMat],
    [0.2, 0.09, copperMat],
    [-0.2, 0.09, copperMat],
  ];
  for (const [x, z, m] of nozzles) {
    const n = nozzle(m, darkMat);
    n.position.set(x, 0, z);
    engines.add(n);
  }
  root.add(engines);

  const restY: Record<string, number> = {
    body: 0,
    heatShield: 0,
    gridFins: 1.75,
    flaps: -1.05,
    legs: -1.7,
    engines: -2.65,
  };
  const explodeY: Record<string, number> = {
    body: 0.2,
    heatShield: -0.4,
    gridFins: 0.9,
    flaps: -0.3,
    legs: -1.0,
    engines: -1.3,
  };

  root.setVariant = (id) => {
    const c = VARIANT[id];
    bodyMat.color.setHex(c.body);
    tipMat.color.setHex(c.tip);
    tpsMat.color.setHex(c.tps);
    if (id === "reusable") {
      copperHot.emissiveIntensity = 0.55;
      copperHot.emissive.setHex(0xff5a1f);
    } else {
      copperHot.emissiveIntensity = 0.25;
      copperHot.emissive.setHex(0x4a1800);
    }
  };

  root.setExplode = (t) => {
    const k = THREE.MathUtils.clamp(t, 0, 1);
    const e = k * k * (3 - 2 * k);
    for (const child of root.children) {
      const n = child.name;
      if (!(n in restY)) continue;
      child.position.y = restY[n] + explodeY[n] * e;
    }
    gridFins.children.forEach((fin, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 0.62 + e * 0.4;
      fin.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    });
    legs.children.forEach((leg, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 0.4 + e * 0.5;
      leg.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      leg.rotation.z = 0.5 + e * 0.35;
    });
  };

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  root.scale.setScalar(0.5);
  return root;
}
