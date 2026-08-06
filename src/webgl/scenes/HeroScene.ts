import * as THREE from "three";
import {
  createRocketModel,
  type RocketModel,
  type RocketQuality,
} from "../models/createRocketModel";
import { smootherstep } from "../cameraRig";
import {
  altitudeY,
  engineBurnFromLanding,
  landingFromSection,
  legsFromLanding,
} from "../landingProgress";

const PAD_TEX = "/textures/ocean-pad-top.jpg";
const WATER_TEX = "/textures/ocean-water.jpg";
const HORIZON_TEX = "/textures/ocean-horizon.jpg";

const PAD_Y = -1.54;
const HULL_Y = -1.72;
const OCEAN_Y = -1.68;
const DUST_Y = -1.51;
const HORIZON_Y = 3.2;

export class HeroScene {
  readonly group = new THREE.Group();
  readonly rocket: RocketModel;
  readonly ground: THREE.Mesh;
  private dust: THREE.Mesh;
  private ocean: THREE.Mesh;
  private horizon: THREE.Mesh;
  private padDeck: THREE.Mesh;
  private padHull: THREE.Mesh;
  private padGroup = new THREE.Group();
  private waterMap: THREE.Texture | null = null;

  private readonly reducedMotion: boolean;
  private mobile = false;
  private baseScale = 0.5;
  private poseRotY = -0.35;
  private poseRotX = 0;
  private poseRotZ = 0.02;
  private posePos = new THREE.Vector3(2.95, 1.2, 0);
  private idleSpin = 0;
  private hoverStrength = 0;
  private targetHover = 0;
  private landing = 0;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private sectionId = "hero";
  private readonly emissiveBoost: {
    mat: THREE.MeshPhysicalMaterial;
    base: number;
    color: THREE.Color;
  }[] = [];

  constructor(reducedMotion = false, quality: RocketQuality = "high") {
    this.reducedMotion = reducedMotion;
    this.rocket = createRocketModel(quality);
    this.rocket.position.copy(this.posePos);
    this.rocket.rotation.set(this.poseRotX, this.poseRotY, this.poseRotZ);
    this.group.add(this.rocket);

    this.rocket.traverse((o) => {
      if (
        o instanceof THREE.Mesh &&
        o.material instanceof THREE.MeshPhysicalMaterial
      ) {
        this.emissiveBoost.push({
          mat: o.material,
          base: o.material.emissiveIntensity,
          color: o.material.emissive.clone(),
        });
      }
    });

    const groundSegs = quality === "low" ? 32 : 72;
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0c3544,
      metalness: 0.55,
      roughness: 0.28,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      envMapIntensity: 0.85,
    });
    this.ocean = new THREE.Mesh(
      new THREE.CircleGeometry(42, groundSegs),
      oceanMat,
    );
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = OCEAN_Y;
    this.ocean.receiveShadow = quality === "high";
    this.ocean.name = "ocean";
    this.ocean.renderOrder = 0;
    this.padGroup.add(this.ocean);

    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
      side: THREE.FrontSide,
    });
    this.horizon = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 42),
      horizonMat,
    );
    this.horizon.position.set(0, HORIZON_Y, -36);
    this.horizon.name = "oceanHorizon";
    this.horizon.renderOrder = -2;
    this.padGroup.add(this.horizon);

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x2a3038,
      metalness: 0.58,
      roughness: 0.58,
      transparent: true,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.padHull = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.4, 0.32, quality === "low" ? 16 : 32),
      hullMat,
    );
    this.padHull.position.y = HULL_Y;
    this.padHull.castShadow = quality === "high";
    this.padHull.receiveShadow = quality === "high";
    this.padHull.name = "padHull";
    this.padHull.renderOrder = 1;
    this.padGroup.add(this.padHull);

    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.22,
      roughness: 0.72,
      transparent: true,
      opacity: 0,
      map: null,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      envMapIntensity: 0.55,
    });
    // Large enough to show water rim baked into pad top texture
    this.padDeck = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), deckMat);
    this.padDeck.rotation.x = -Math.PI / 2;
    this.padDeck.position.y = PAD_Y;
    this.padDeck.receiveShadow = quality === "high";
    this.padDeck.name = "padDeck";
    this.padDeck.renderOrder = 2;
    this.padGroup.add(this.padDeck);

    this.ground = this.padDeck;

    this.dust = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 1.45, 48),
      new THREE.MeshBasicMaterial({
        color: 0xd8e4ea,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.dust.rotation.x = -Math.PI / 2;
    this.dust.position.y = DUST_Y;
    this.dust.name = "dust";
    this.dust.renderOrder = 3;
    this.padGroup.add(this.dust);

    this.padGroup.position.x = 2.95;
    this.group.add(this.padGroup);

    this.loadSurfaceTextures(
      deckMat,
      oceanMat,
      this.horizon.material as THREE.MeshBasicMaterial,
    );
  }

  private loadSurfaceTextures(
    deckMat: THREE.MeshStandardMaterial,
    oceanMat: THREE.MeshStandardMaterial,
    horizonMat: THREE.MeshBasicMaterial,
  ) {
    if (typeof window === "undefined") return;
    const loader = new THREE.TextureLoader();
    loader.load(
      PAD_TEX,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        deckMat.map = tex;
        deckMat.needsUpdate = true;
      },
      undefined,
      () => {
        deckMat.color.set(0x4a5560);
        deckMat.needsUpdate = true;
      },
    );
    loader.load(
      WATER_TEX,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(7, 7);
        this.waterMap = tex;
        oceanMat.map = tex;
        oceanMat.needsUpdate = true;
      },
      undefined,
      () => {
        oceanMat.color.set(0x0a3040);
        oceanMat.needsUpdate = true;
      },
    );
    loader.load(
      HORIZON_TEX,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        horizonMat.map = tex;
        horizonMat.needsUpdate = true;
      },
      undefined,
      () => {
        horizonMat.color.set(0x3a5a70);
        horizonMat.needsUpdate = true;
      },
    );
  }

  setMobile(mobile: boolean) {
    this.mobile = mobile;
    this.padGroup.position.x = mobile ? 0 : 2.95;
  }

  setBaseScale(scale: number) {
    this.baseScale = scale;
    this.rocket.scale.setScalar(scale);
  }

  setVariant(id: "standard" | "heavy" | "reusable") {
    this.rocket.setVariant(id);
    for (const item of this.emissiveBoost) {
      item.base = item.mat.emissiveIntensity;
      item.color.copy(item.mat.emissive);
    }
  }

  setPointer(nx: number, ny: number, active: boolean) {
    if (this.mobile || this.reducedMotion) {
      this.targetHover = 0;
      return;
    }
    this.pointer.set(nx, ny);
    this.targetHover = active ? 1 : 0;
  }

  pick(camera: THREE.Camera): boolean {
    if (this.mobile || this.reducedMotion) return false;
    this.raycaster.setFromCamera(this.pointer, camera);
    return this.raycaster.intersectObject(this.rocket, true).length > 0;
  }

  getLanding() {
    return this.landing;
  }

  setProgress(sectionId: string, t: number) {
    this.sectionId = sectionId;
    const k = smootherstep(THREE.MathUtils.clamp(t, 0, 1));
    this.landing = landingFromSection(sectionId, t);

    const x = this.mobile ? 0 : 2.95;
    const alt = altitudeY(this.landing, this.mobile);
    const legs = legsFromLanding(this.landing);
    const burn = engineBurnFromLanding(this.landing);

    this.rocket.setLandingGear(legs);
    this.rocket.setEngineBurn(burn);
    this.rocket.setExplode(0);

    const settle = THREE.MathUtils.smoothstep(this.landing, 0.88, 1);
    this.poseRotY = THREE.MathUtils.lerp(-0.55 + k * 0.15, 0.35, this.landing);
    this.poseRotX = THREE.MathUtils.lerp(
      0.08,
      THREE.MathUtils.lerp(-0.04, 0, settle),
      this.landing,
    );
    this.poseRotZ = THREE.MathUtils.lerp(0.03, 0, settle);

    const drift =
      Math.sin(this.landing * Math.PI * 1.2) *
      (this.mobile ? 0.08 : 0.14) *
      (1 - settle);
    this.posePos.set(x + drift, alt, THREE.MathUtils.lerp(0.2, 0, this.landing));

    // Ocean first, pad slightly later — ASDS emerges from haze
    const oceanReveal = THREE.MathUtils.smoothstep(this.landing, 0.4, 0.78);
    const padReveal = THREE.MathUtils.smoothstep(this.landing, 0.48, 0.86);
    const oceanMat = this.ocean.material as THREE.MeshStandardMaterial;
    const horizonMat = this.horizon.material as THREE.MeshBasicMaterial;
    const deckMat = this.padDeck.material as THREE.MeshStandardMaterial;
    const hullMat = this.padHull.material as THREE.MeshStandardMaterial;

    // Go opaque early — transparent water + fog paints a white disc over the pad
    const oceanSolid = oceanReveal > 0.55;
    oceanMat.transparent = !oceanSolid;
    oceanMat.opacity = oceanSolid ? 1 : oceanReveal;
    oceanMat.depthWrite = oceanReveal > 0.25;
    oceanMat.roughness = THREE.MathUtils.lerp(0.45, 0.22, oceanReveal);
    oceanMat.metalness = THREE.MathUtils.lerp(0.35, 0.62, oceanReveal);

    horizonMat.opacity = oceanReveal * 0.88;
    this.horizon.visible = oceanReveal > 0.04;

    const padSolid = padReveal > 0.55;
    deckMat.transparent = !padSolid;
    deckMat.opacity = padSolid ? 1 : padReveal;
    deckMat.depthWrite = padReveal > 0.2;
    hullMat.transparent = !padSolid;
    hullMat.opacity = padSolid ? 1 : padReveal * 0.98;
    hullMat.depthWrite = padReveal > 0.2;

    this.padDeck.visible = padReveal > 0.02;
    this.padHull.visible = padReveal > 0.02;
    this.ocean.visible = oceanReveal > 0.02;

    // No pale dust ring — read as white circle over pad
    const dustMat = this.dust.material as THREE.MeshBasicMaterial;
    dustMat.opacity = 0;
    this.dust.visible = false;

    if (sectionId === "systems") {
      this.poseRotY += k * 0.25;
    } else if (sectionId === "variants") {
      this.poseRotY += k * 0.4;
    } else if (sectionId === "specs") {
      this.poseRotX += k * -0.08;
    }
  }

  update(delta: number, elapsed: number) {
    this.hoverStrength = THREE.MathUtils.damp(
      this.hoverStrength,
      this.targetHover,
      8,
      delta,
    );

    const landed = this.landing > 0.97;
    if (!this.reducedMotion && !landed) {
      const spin = (this.mobile ? 0.025 : 0.04) * (1 - this.landing * 0.85);
      this.idleSpin += delta * spin;
    }

    const hoverSpin = this.hoverStrength * 0.2 * (1 - this.landing);
    this.rocket.rotation.y = this.poseRotY + this.idleSpin + hoverSpin;
    this.rocket.rotation.x = this.poseRotX;
    this.rocket.rotation.z = this.poseRotZ;

    const bob =
      !this.reducedMotion && this.landing < 0.55
        ? Math.sin(elapsed * 0.9) * 0.03 * (1 - this.landing)
        : 0;
    const hoverLift = this.hoverStrength * 0.08 * (1 - this.landing);
    const settle =
      this.landing > 0.9 && !this.reducedMotion
        ? Math.sin((this.landing - 0.9) * 40) *
          0.012 *
          (1 - THREE.MathUtils.smoothstep(this.landing, 0.9, 1))
        : 0;

    this.rocket.position.set(
      this.posePos.x,
      this.posePos.y + bob + hoverLift + settle,
      this.posePos.z,
    );

    this.rocket.scale.setScalar(
      this.baseScale * (1 + this.hoverStrength * 0.006),
    );

    if (this.landing > 0.38 && !this.reducedMotion) {
      this.ocean.position.y = OCEAN_Y + Math.sin(elapsed * 0.55) * 0.01;
      if (this.waterMap) {
        this.waterMap.offset.x = (elapsed * 0.008) % 1;
        this.waterMap.offset.y = (elapsed * 0.005) % 1;
      }
    }
  }
}
