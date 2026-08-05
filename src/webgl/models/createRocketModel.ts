import * as THREE from "three";

export type RocketVariant = "standard" | "heavy" | "reusable";

export type RocketModel = THREE.Group & {
  setVariant: (id: RocketVariant) => void;
  setExplode: (t: number) => void;
  setLandingGear: (deploy: number) => void;
  setEngineBurn: (burn: number) => void;
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
    roughness: 0.5,
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.45,
    ...opts,
  });
}

export type RocketQuality = "high" | "low";

function hexTexture(size = 256, highDetail = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#12151a";
  ctx.fillRect(0, 0, size, size);

  const radius = size / (highDetail ? 12 : 11);
  const h = radius * Math.sqrt(3);
  for (let row = -1; row < 18; row++) {
    for (let col = -1; col < 16; col++) {
      const x = col * radius * 1.5;
      const y = row * h + ((col & 1) * h) / 2;
      const shade = 6 + ((row * 3 + col * 5) % 10);
      const g = shade + (highDetail ? (row + col) % 3 : 0);
      ctx.fillStyle = `rgb(${g},${g + 1},${g + 4})`;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = ((60 * i - 30) * Math.PI) / 180;
        const px = x + Math.cos(a) * radius * 0.88;
        const py = y + Math.sin(a) * radius * 0.88;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = highDetail
        ? "rgba(255,255,255,0.08)"
        : "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (highDetail && (row + col) % 4 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(highDetail ? 7 : 5, highDetail ? 4 : 3);
  tex.anisotropy = highDetail ? 8 : 4;
  return tex;
}

function bodyPaintTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f2ed";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(20,24,30,0.14)";
  ctx.lineWidth = 2;
  for (let i = 1; i < 8; i++) {
    const y = (i / 8) * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(20,24,30,0.1)";
  for (let i = 0; i < 16; i++) {
    const x = (i / 16) * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const x = (i * 47) % size;
    const y = (i * 91) % size;
    ctx.fillStyle = "rgba(30,34,40,0.18)";
    ctx.fillRect(x, y, 2, 2);
  }
  const band = ctx.createLinearGradient(0, size * 0.55, 0, size * 0.7);
  band.addColorStop(0, "rgba(255,90,31,0)");
  band.addColorStop(0.5, "rgba(255,90,31,0.12)");
  band.addColorStop(1, "rgba(255,90,31,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, size * 0.55, size, size * 0.15);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(4, 1);
  tex.anisotropy = 8;
  return tex;
}

function gridFin(
  metal: THREE.Material,
  dark: THREE.Material,
  dense = true,
) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.02), dark);
  g.add(plate);

  const beamH = new THREE.BoxGeometry(0.42, 0.016, 0.018);
  const beamV = new THREE.BoxGeometry(0.016, 0.3, 0.018);
  const hRange = dense ? 2 : 1;
  const vRange = dense ? 3 : 2;
  for (let i = -hRange; i <= hRange; i++) {
    const h = new THREE.Mesh(beamH, metal);
    h.position.set(0, i * (dense ? 0.06 : 0.1), 0.016);
    g.add(h);
  }
  for (let i = -vRange; i <= vRange; i++) {
    const v = new THREE.Mesh(beamV, metal);
    v.position.set(i * (dense ? 0.055 : 0.08), 0, 0.016);
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

function nozzle(
  copper: THREE.Material,
  dark: THREE.Material,
  high = false,
) {
  const g = new THREE.Group();
  const radial = high ? 24 : 16;
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, high ? 0.105 : 0.1, 0.3, radial, 1, true),
    copper,
  );
  bell.position.y = -0.08;
  g.add(bell);
  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.07, 0.22, high ? 18 : 12, 1, true),
    dark,
  );
  inner.position.y = -0.04;
  g.add(inner);
  const throat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.038, 0.07, high ? 14 : 10),
    dark,
  );
  throat.position.y = 0.1;
  g.add(throat);
  if (high) {
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.006, 8, 24),
      copper,
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = -0.23;
    g.add(lip);
  }
  return g;
}

export function createRocketModel(quality: RocketQuality = "high"): RocketModel {
  const low = quality === "low";
  const segs = low ? 20 : 64;
  const sphereW = low ? 16 : 48;
  const sphereH = low ? 12 : 32;
  const ringSegs = low ? 24 : 64;

  const root = new THREE.Group() as RocketModel;
  root.name = "rocket";

  const paintMap = low ? null : bodyPaintTexture();
  const bodyMat = mat(VARIANT.standard.body, {
    ...(paintMap ? { map: paintMap } : {}),
    metalness: 0.06,
    roughness: low ? 0.58 : 0.55,
    clearcoat: low ? 0.04 : 0.1,
    clearcoatRoughness: low ? 0.55 : 0.5,
    envMapIntensity: low ? 0.22 : 0.25,
  });
  const tipMat = mat(VARIANT.standard.tip, {
    metalness: 0.82,
    roughness: 0.34,
    clearcoat: low ? 0 : 0.06,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.35,
  });
  const metalMat = mat(0x7e868f, {
    metalness: 0.78,
    roughness: 0.45,
    clearcoat: 0,
    envMapIntensity: 0.32,
  });
  const darkMat = mat(0x2a2e34, {
    metalness: 0.55,
    roughness: 0.55,
    clearcoat: 0,
    envMapIntensity: 0.22,
  });
  const copperMat = mat(0x9a6432, {
    metalness: 0.86,
    roughness: 0.42,
    clearcoat: 0,
    envMapIntensity: 0.35,
  });
  const copperHot = mat(0x8a4e26, {
    metalness: 0.8,
    roughness: 0.48,
    emissive: new THREE.Color(0x1a0800),
    emissiveIntensity: 0.08,
    clearcoat: 0,
    envMapIntensity: 0.3,
  });
  const tpsMat = mat(VARIANT.standard.tps, {
    map: hexTexture(low ? 128 : 512, !low),
    metalness: 0.18,
    roughness: low ? 0.62 : 0.58,
    clearcoat: low ? 0.05 : 0.1,
    clearcoatRoughness: 0.45,
    envMapIntensity: low ? 0.18 : 0.2,
  });

  const body = new THREE.Group();
  body.name = "body";

  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.56, 3.4, segs),
    bodyMat,
  );
  fuselage.position.y = 0.1;
  body.add(fuselage);

  const upperTaper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.52, 0.55, segs),
    bodyMat,
  );
  upperTaper.position.y = 2.05;
  body.add(upperTaper);

  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, sphereW, sphereH),
    bodyMat,
  );
  nose.scale.set(1, 1.55, 1);
  nose.position.y = 2.55;
  body.add(nose);

  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, low ? 10 : 24, low ? 8 : 18),
    tipMat,
  );
  tip.scale.set(1, 1.3, 1);
  tip.position.y = 3.2;
  body.add(tip);

  if (!low) {
    const raceway = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 2.4, 0.05),
      metalMat,
    );
    raceway.position.set(0.54, 0.2, 0);
    body.add(raceway);

    const windowBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.525, 0.525, 0.08, segs),
      darkMat,
    );
    windowBand.position.y = 1.35;
    body.add(windowBand);
  }

  const ringYs = low ? [1.6, -0.2] : [1.6, 0.7, -0.2, -1.0];
  for (const y of ringYs) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.545, 0.008, 6, ringSegs),
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
    new THREE.CylinderGeometry(0.57, 0.5, 1.65, segs),
    tpsMat,
  );
  tps.position.y = -1.55;
  heatShield.add(tps);
  const tpsLower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.4, 0.35, segs),
    tpsMat,
  );
  tpsLower.position.y = -2.45;
  heatShield.add(tpsLower);
  if (!low) {
    const seam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.572, 0.568, 0.06, segs),
      darkMat,
    );
    seam.position.y = -0.72;
    heatShield.add(seam);
  }
  root.add(heatShield);

  const gridFins = new THREE.Group();
  gridFins.name = "gridFins";
  gridFins.position.y = 1.75;
  for (let i = 0; i < 4; i++) {
    const fin = gridFin(metalMat, darkMat, !low);
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
  const legAngles: number[] = [];
  for (let i = 0; i < 4; i++) {
    const leg = landingLeg(metalMat, darkMat);
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    legAngles.push(a);
    leg.position.set(Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.22);
    leg.rotation.y = -a + Math.PI / 2;
    leg.rotation.z = 0.08;
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

  const nozzles: [number, number, THREE.Material][] = low
    ? [
        [0, 0, copperHot],
        [0.15, 0, copperMat],
        [-0.15, 0, copperMat],
        [0.075, 0.13, copperMat],
        [-0.075, 0.13, copperMat],
      ]
    : [
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
    const n = nozzle(m, darkMat, !low);
    n.position.set(x, 0, z);
    engines.add(n);
  }
  root.add(engines);

  let gearDeploy = 0;
  let engineBurn = 0.12;

  root.setVariant = (id) => {
    const c = VARIANT[id];
    bodyMat.color.setHex(c.body);
    tipMat.color.setHex(c.tip);
    tpsMat.color.setHex(c.tps);
    root.setEngineBurn(engineBurn);
  };

  root.setLandingGear = (deploy) => {
    gearDeploy = THREE.MathUtils.clamp(deploy, 0, 1);
    const e = gearDeploy * gearDeploy * (3 - 2 * gearDeploy);
    legs.children.forEach((leg, i) => {
      const a = legAngles[i];
      const r = THREE.MathUtils.lerp(0.2, 0.42, e);
      const z = THREE.MathUtils.lerp(0.06, 0.52, e);
      const y = THREE.MathUtils.lerp(0.08, 0, e);
      leg.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      leg.rotation.y = -a + Math.PI / 2;
      leg.rotation.z = z;
    });
    // grid fins tilt out slightly on entry, settle later
    const finT = THREE.MathUtils.smoothstep(gearDeploy, 0, 0.55);
    gridFins.children.forEach((fin, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 0.62 + finT * 0.06;
      fin.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      fin.rotation.z = 0.05 + finT * 0.12;
    });
  };

  root.setEngineBurn = (burn) => {
    engineBurn = THREE.MathUtils.clamp(burn, 0, 1);
    // Keep energy on nozzles only; cap so bloom does not lift the stack
    copperHot.emissiveIntensity = 0.04 + engineBurn * 0.28;
    copperHot.emissive.setRGB(
      0.12 + engineBurn * 0.35,
      0.03 + engineBurn * 0.08,
      0.008,
    );
  };

  // legacy API — landing story supersedes explode
  root.setExplode = () => {
    root.setLandingGear(gearDeploy);
  };

  root.setLandingGear(0);
  root.setEngineBurn(0.1);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  root.scale.setScalar(0.5);
  return root;
}
