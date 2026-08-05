import * as THREE from "three";

export type RocketModel = THREE.Group & {
  setVariant: (id: "standard" | "heavy" | "reusable") => void;
  setExplode: (t: number) => void;
};

const VARIANT_COLORS: Record<
  "standard" | "heavy" | "reusable",
  { body: number; accent: number }
> = {
  standard: { body: 0xf2efe8, accent: 0x1a1d22 },
  heavy: { body: 0xd9dde3, accent: 0x2a3140 },
  reusable: { body: 0xf4f1ea, accent: 0xff5a1f },
};

function makeMat(
  color: number,
  opts: Partial<THREE.MeshPhysicalMaterialParameters> = {},
) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.35,
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    ...opts,
  });
}

export function createRocketModel(): RocketModel {
  const root = new THREE.Group() as RocketModel;
  root.name = "rocket";

  const bodyMat = makeMat(VARIANT_COLORS.standard.body);
  const darkMat = makeMat(VARIANT_COLORS.standard.accent, {
    metalness: 0.7,
    roughness: 0.35,
  });
  const metalMat = makeMat(0x9aa3ad, {
    metalness: 0.85,
    roughness: 0.28,
  });
  const nozzleMat = makeMat(0x2b3038, {
    metalness: 0.9,
    roughness: 0.25,
  });
  const emberMat = makeMat(0xff5a1f, {
    metalness: 0.2,
    roughness: 0.45,
    emissive: new THREE.Color(0xff3b00),
    emissiveIntensity: 0.35,
  });

  const bodyGroup = new THREE.Group();
  bodyGroup.name = "body";

  const fuselage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.48, 3.2, 32, 1, false),
    bodyMat,
  );
  fuselage.position.y = 0.2;
  bodyGroup.add(fuselage);

  const interstage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.5, 0.18, 32),
    darkMat,
  );
  interstage.position.y = -1.5;
  bodyGroup.add(interstage);

  const fairing = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.15, 32),
    bodyMat,
  );
  fairing.position.y = 2.35;
  bodyGroup.add(fairing);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 16), metalMat);
  tip.position.y = 3.0;
  bodyGroup.add(tip);

  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.425, 0.425, 0.12, 32),
    emberMat,
  );
  stripe.position.y = 1.1;
  bodyGroup.add(stripe);

  const logoBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.422, 0.422, 0.06, 32),
    darkMat,
  );
  logoBand.position.y = 0.55;
  bodyGroup.add(logoBand);

  root.add(bodyGroup);

  const engineGroup = new THREE.Group();
  engineGroup.name = "engines";
  engineGroup.position.y = -1.85;

  const engineCluster = new THREE.Group();
  const enginePositions: [number, number][] = [
    [0, 0],
    [0.28, 0.16],
    [-0.28, 0.16],
    [0, -0.32],
  ];

  for (const [x, z] of enginePositions) {
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.16, 0.42, 20, 1, true),
      nozzleMat,
    );
    bell.position.set(x, -0.15, z);
    engineCluster.add(bell);

    const throat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12),
      metalMat,
    );
    throat.position.set(x, 0.1, z);
    engineCluster.add(throat);
  }

  engineGroup.add(engineCluster);
  root.add(engineGroup);

  const finGroup = new THREE.Group();
  finGroup.name = "fins";
  finGroup.position.y = -1.15;

  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.55, 0.42),
      darkMat,
    );
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    fin.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
    fin.lookAt(0, fin.position.y, 0);
    fin.rotateY(Math.PI / 2);
    finGroup.add(fin);
  }
  root.add(finGroup);

  const gridGroup = new THREE.Group();
  gridGroup.name = "gridFins";
  gridGroup.position.y = 1.45;

  for (let i = 0; i < 4; i++) {
    const grid = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.32),
      metalMat,
    );
    const angle = (i / 4) * Math.PI * 2;
    grid.position.set(Math.cos(angle) * 0.5, 0, Math.sin(angle) * 0.5);
    grid.lookAt(0, grid.position.y, 0);
    grid.rotateY(Math.PI / 2);
    gridGroup.add(grid);
  }
  root.add(gridGroup);

  const legGroup = new THREE.Group();
  legGroup.name = "legs";
  legGroup.position.y = -1.55;

  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.02, 0.85, 8),
      metalMat,
    );
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    leg.position.set(Math.cos(angle) * 0.35, -0.2, Math.sin(angle) * 0.35);
    leg.rotation.z = Math.cos(angle) * 0.55;
    leg.rotation.x = Math.sin(angle) * 0.55;
    legGroup.add(leg);
  }
  root.add(legGroup);

  const restY: Record<string, number> = {
    body: 0,
    engines: -1.85,
    fins: -1.15,
    gridFins: 1.45,
    legs: -1.55,
  };

  const explodeDir: Record<string, number> = {
    body: 0,
    engines: -1.2,
    fins: -0.55,
    gridFins: 0.7,
    legs: -0.9,
  };

  root.setVariant = (id) => {
    const c = VARIANT_COLORS[id];
    bodyMat.color.setHex(c.body);
    darkMat.color.setHex(c.accent);
    if (id === "reusable") {
      emberMat.emissiveIntensity = 0.55;
    } else {
      emberMat.emissiveIntensity = 0.35;
    }
  };

  root.setExplode = (t) => {
    const k = THREE.MathUtils.clamp(t, 0, 1);
    const ease = k * k * (3 - 2 * k);
    for (const child of root.children) {
      const name = child.name;
      if (!(name in restY)) continue;
      child.position.y = restY[name] + explodeDir[name] * ease;
    }
  };

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return root;
}
