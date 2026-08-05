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

export class HeroScene {
  readonly group = new THREE.Group();
  readonly rocket: RocketModel;
  readonly ground: THREE.Mesh;
  private dust: THREE.Mesh;

  private readonly reducedMotion: boolean;
  private mobile = false;
  private baseScale = 0.5;
  private poseRotY = -0.35;
  private poseRotX = 0;
  private poseRotZ = 0.02;
  private posePos = new THREE.Vector3(1.05, 2.0, 0);
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
    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.5, groundSegs),
      new THREE.MeshStandardMaterial({
        color: 0x10141a,
        metalness: 0.15,
        roughness: 0.92,
      }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -1.55;
    this.ground.receiveShadow = quality === "high";
    this.ground.name = "ground";
    this.group.add(this.ground);

    this.dust = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 1.1, 48),
      new THREE.MeshBasicMaterial({
        color: 0xc4b8a4,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.dust.rotation.x = -Math.PI / 2;
    this.dust.position.y = -1.54;
    this.dust.name = "dust";
    this.group.add(this.dust);
  }

  setMobile(mobile: boolean) {
    this.mobile = mobile;
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

    const x = this.mobile ? 0 : 1.05;
    const alt = altitudeY(this.landing, this.mobile);
    const legs = legsFromLanding(this.landing);
    const burn = engineBurnFromLanding(this.landing);

    this.rocket.setLandingGear(legs);
    this.rocket.setEngineBurn(burn);
    this.rocket.setExplode(0);

    // gentle yaw as it comes in — settle when landed
    const settle = THREE.MathUtils.smoothstep(this.landing, 0.88, 1);
    this.poseRotY = THREE.MathUtils.lerp(-0.55 + k * 0.15, 0.35, this.landing);
    this.poseRotX = THREE.MathUtils.lerp(
      0.08,
      THREE.MathUtils.lerp(-0.04, 0, settle),
      this.landing,
    );
    this.poseRotZ = THREE.MathUtils.lerp(0.03, 0, settle);

    // slight lateral drift that corrects near pad
    const drift =
      Math.sin(this.landing * Math.PI * 1.2) *
      (this.mobile ? 0.08 : 0.14) *
      (1 - settle);
    this.posePos.set(x + drift, alt, THREE.MathUtils.lerp(0.2, 0, this.landing));

    // dust bloom near touchdown
    const dustT = THREE.MathUtils.smoothstep(this.landing, 0.82, 1);
    const dustMat = this.dust.material as THREE.MeshBasicMaterial;
    dustMat.opacity = dustT * 0.35;
    this.dust.scale.setScalar(0.6 + dustT * 1.8);

    // section-local polish without fighting landing height
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

    // micro float only while high
    const bob =
      !this.reducedMotion && this.landing < 0.55
        ? Math.sin(elapsed * 0.9) * 0.03 * (1 - this.landing)
        : 0;
    const hoverLift = this.hoverStrength * 0.08 * (1 - this.landing);
    // soft settle bounce at touchdown
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

    // dust pulse
    if (this.landing > 0.85) {
      const s = 0.6 + this.landing * 1.8 + Math.sin(elapsed * 6) * 0.03;
      this.dust.scale.setScalar(s);
    }
  }
}
