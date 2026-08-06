import * as THREE from "three";

const SKY_TEX = "/textures/sky-atmosphere.jpg";

export type AtmosphereLayer = {
  group: THREE.Group;
  setProgress: (stars: number, sky: number, ocean?: number) => void;
  dispose: () => void;
};

export function createAtmosphere(quality: "high" | "low"): AtmosphereLayer {
  const group = new THREE.Group();
  group.name = "atmosphere";

  const segs = quality === "high" ? 48 : 24;

  // Soft vignette shell only — starfield lives in CSS (avoids bloom squares)
  const spaceGeo = new THREE.SphereGeometry(55, segs, segs);
  const spaceMat = new THREE.MeshBasicMaterial({
    color: 0x05060a,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    fog: false,
  });
  const spaceDome = new THREE.Mesh(spaceGeo, spaceMat);
  spaceDome.name = "spaceDome";
  spaceDome.frustumCulled = false;
  group.add(spaceDome);

  const skyGeo = new THREE.SphereGeometry(
    48,
    segs,
    Math.max(12, Math.floor(segs * 0.55)),
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.62,
  );
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.y = -3;
  sky.name = "skyDome";
  group.add(sky);

  const hazeMat = new THREE.MeshBasicMaterial({
    color: 0x8aabc8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending,
  });
  const haze = new THREE.Mesh(
    new THREE.RingGeometry(16, 38, quality === "high" ? 64 : 32),
    hazeMat,
  );
  haze.rotation.x = -Math.PI / 2;
  haze.position.y = -1.2;
  haze.name = "atmHaze";
  group.add(haze);

  if (typeof window !== "undefined") {
    const loader = new THREE.TextureLoader();
    loader.load(SKY_TEX, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      skyMat.map = tex;
      skyMat.needsUpdate = true;
    });
  }

  return {
    group,
    setProgress(starAmt: number, skyAmt: number, oceanAmt = 0) {
      const s = THREE.MathUtils.clamp(starAmt, 0, 1);
      const k = THREE.MathUtils.clamp(skyAmt, 0, 1);
      const o = THREE.MathUtils.clamp(oceanAmt, 0, 1);

      spaceMat.opacity = s * 0.28;
      spaceDome.visible = s > 0.05;

      skyMat.opacity = k * (1 - o * 0.85) * 0.94;
      sky.visible = skyMat.opacity > 0.02;

      // Haze dies on terminal approach — otherwise it reads as milky disc over pad
      hazeMat.opacity =
        Math.min(1, k * (1 - s * 0.4) * (1 - o)) * 0.22;
      haze.visible = hazeMat.opacity > 0.01;
    },
    dispose() {
      spaceGeo.dispose();
      spaceMat.dispose();
      skyGeo.dispose();
      skyMat.map?.dispose();
      skyMat.dispose();
      haze.geometry.dispose();
      hazeMat.dispose();
    },
  };
}
