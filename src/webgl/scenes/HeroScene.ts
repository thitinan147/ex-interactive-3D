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

export class HeroScene {
  readonly group = new THREE.Group();
  readonly rocket: RocketModel;
  readonly ground: THREE.Mesh;
  private dust: THREE.Mesh;
  private ocean: THREE.Mesh;
  private padDeck: THREE.Mesh;
  private padHull: THREE.Mesh;
  private padGroup = new THREE.Group();

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

    const groundSegs = quality === "low" ? 28 : 64;
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0d3a48,
      metalness: 0.45,
      roughness: 0.42,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.ocean = new THREE.Mesh(
      new THREE.CircleGeometry(22, groundSegs),
      oceanMat,
    );
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -1.64;
    this.ocean.name = "ocean";
    this.padGroup.add(this.ocean);

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x2a3038,
      metalness: 0.55,
      roughness: 0.62,
      transparent: true,
      opacity: 0,
    });
    this.padHull = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.35, 0.28, quality === "low" ? 16 : 32),
      hullMat,
    );
    this.padHull.position.y = -1.7;
    this.padHull.castShadow = quality === "high";
    this.padHull.receiveShadow = quality === "high";
    this.padHull.name = "padHull";
    this.padGroup.add(this.padHull);

    const deckMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.28,
      roughness: 0.78,
      transparent: true,
      opacity: 0,
      map: null,
    });
    this.padDeck = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), deckMat);
    this.padDeck.rotation.x = -Math.PI / 2;
    this.padDeck.position.y = -1.54;
    this.padDeck.receiveShadow = quality === "high";
    this.padDeck.name = "padDeck";
    this.padGroup.add(this.padDeck);

    // Legacy alias — pad deck is the touch surface
    this.ground = this.padDeck;

    this.dust = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 1.35, 48),
      new THREE.MeshBasicMaterial({
        color: 0xd8e0e6,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.dust.rotation.x = -Math.PI / 2;
    this.dust.position.y = -1.52;
    this.dust.name = "dust";
    this.padGroup.add(this.dust);

    this.padGroup.position.x = 2.95;
    this.group.add(this.padGroup);

    this.loadPadTexture(deckMat);
  }

  private loadPadTexture(deckMat: THREE.MeshStandardMaterial) {
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

    // Pad + ocean: terminal ASDS approach (after sky phase)
    const padReveal = THREE.MathUtils.smoothstep(this.landing, 0.45, 0.86);
    const oceanMat = this.ocean.material as THREE.MeshStandardMaterial;
    const deckMat = this.padDeck.material as THREE.MeshStandardMaterial;
    const hullMat = this.padHull.material as THREE.MeshStandardMaterial;
    oceanMat.opacity = padReveal * 0.98;
    oceanMat.depthWrite = padReveal > 0.35;
    deckMat.opacity = padReveal;
    hullMat.opacity = padReveal * 0.98;
    this.padDeck.visible = padReveal > 0.02;
    this.padHull.visible = padReveal > 0.02;
    this.ocean.visible = padReveal > 0.02;

    const dustT = THREE.MathUtils.smoothstep(this.landing, 0.82, 1);
    const dustMat = this.dust.material as THREE.MeshBasicMaterial;
    dustMat.opacity = dustT * 0.4;
    this.dust.scale.setScalar(0.55 + dustT * 1.7);

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

    if (this.landing > 0.85) {
      const s = 0.55 + this.landing * 1.7 + Math.sin(elapsed * 6) * 0.03;
      this.dust.scale.setScalar(s);
    }

    // Subtle ocean swell when pad is visible
    if (this.landing > 0.4 && !this.reducedMotion) {
      this.ocean.position.y = -1.62 + Math.sin(elapsed * 0.55) * 0.012;
    }
  }
}
