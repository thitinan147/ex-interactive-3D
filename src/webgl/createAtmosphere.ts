import * as THREE from "three";

const SKY_TEX = "/textures/sky-atmosphere.jpg";

export type AtmosphereLayer = {
  group: THREE.Group;
  setProgress: (stars: number, sky: number) => void;
  dispose: () => void;
};

export function createAtmosphere(quality: "high" | "low"): AtmosphereLayer {
  const group = new THREE.Group();
  group.name = "atmosphere";

  const starCount = quality === "high" ? 900 : 320;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    // hemisphere + upper sphere — space above / around stack
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(1 - v * 0.92);
    const r = 28 + Math.random() * 18;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.85 + 4;
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    sizes[i] = 0.6 + Math.random() * 1.4;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  const starMat = new THREE.PointsMaterial({
    color: 0xd8e0ea,
    size: quality === "high" ? 0.055 : 0.07,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.name = "stars";
  stars.frustumCulled = false;
  group.add(stars);

  const skySegs = quality === "high" ? 48 : 24;
  const skyGeo = new THREE.SphereGeometry(42, skySegs, skySegs * 0.5, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.y = -2;
  sky.name = "skyDome";
  group.add(sky);

  if (typeof window !== "undefined") {
    const loader = new THREE.TextureLoader();
    loader.load(SKY_TEX, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.mapping = THREE.EquirectangularReflectionMapping;
      skyMat.map = tex;
      skyMat.needsUpdate = true;
    });
  }

  // Soft atmosphere band near horizon (reentry / blue glow)
  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0x7a9ab8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Mesh(
    new THREE.RingGeometry(18, 36, quality === "high" ? 64 : 32),
    hazeMat,
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = -0.8;
  haze.name = "atmHaze";
  group.add(haze);

  return {
    group,
    setProgress(starAmt: number, skyAmt: number) {
      starMat.opacity = THREE.MathUtils.clamp(starAmt, 0, 1) * 0.9;
      stars.visible = starMat.opacity > 0.02;
      skyMat.opacity = THREE.MathUtils.clamp(skyAmt, 0, 1) * 0.92;
      sky.visible = skyMat.opacity > 0.02;
      hazeMat.opacity = THREE.MathUtils.clamp(skyAmt * (1 - starAmt * 0.35), 0, 1) * 0.22;
      haze.visible = hazeMat.opacity > 0.01;
    },
    dispose() {
      starGeo.dispose();
      starMat.dispose();
      skyGeo.dispose();
      skyMat.map?.dispose();
      skyMat.dispose();
      haze.geometry.dispose();
      hazeMat.dispose();
    },
  };
}
