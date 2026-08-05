import * as THREE from "three";
import {
  createRocketModel,
  type RocketModel,
  type RocketQuality,
} from "../models/createRocketModel";

export class HeroScene {
  readonly group = new THREE.Group();
  readonly rocket: RocketModel;

  private readonly reducedMotion: boolean;
  private mobile = false;
  private baseY = -0.05;

  constructor(reducedMotion = false, quality: RocketQuality = "high") {
    this.reducedMotion = reducedMotion;
    this.rocket = createRocketModel(quality);
    this.rocket.position.set(1.05, this.baseY, 0);
    this.rocket.rotation.y = -0.35;
    this.rocket.rotation.z = 0.02;
    this.group.add(this.rocket);

    const groundSegs = quality === "low" ? 28 : 64;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, groundSegs),
      new THREE.MeshStandardMaterial({
        color: 0x10141a,
        metalness: 0.15,
        roughness: 0.92,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.55;
    ground.receiveShadow = quality === "high";
    this.group.add(ground);
  }

  setMobile(mobile: boolean) {
    this.mobile = mobile;
    this.baseY = mobile ? -0.45 : -0.05;
  }

  setVariant(id: "standard" | "heavy" | "reusable") {
    this.rocket.setVariant(id);
  }

  setProgress(sectionId: string, t: number) {
    const k = THREE.MathUtils.clamp(t, 0, 1);
    const x = this.mobile ? 0 : 1.05;
    const y0 = this.baseY;

    switch (sectionId) {
      case "hero": {
        this.rocket.rotation.y = -0.35 + k * 0.25;
        this.rocket.rotation.x = 0;
        this.rocket.position.set(x, y0 + k * 0.06, 0);
        this.rocket.setExplode(0);
        break;
      }
      case "systems": {
        this.rocket.rotation.y = -0.1 + k * 0.3;
        this.rocket.rotation.x = 0;
        this.rocket.position.set(x, y0 + (this.mobile ? 0.05 : 0.08), 0);
        this.rocket.setExplode(k);
        break;
      }
      case "variants": {
        this.rocket.setExplode(0);
        this.rocket.rotation.x = 0;
        this.rocket.rotation.y = 0.2 + k * 0.4;
        this.rocket.position.set(x, y0, 0);
        break;
      }
      case "specs": {
        this.rocket.setExplode(0);
        this.rocket.rotation.y = this.mobile ? 0.45 : 0.65;
        this.rocket.rotation.x = -0.08 * k;
        this.rocket.position.set(x, y0, 0);
        break;
      }
      case "reel":
      case "order":
      case "footer": {
        this.rocket.setExplode(0);
        this.rocket.rotation.x = 0;
        this.rocket.rotation.y = this.mobile ? 0.55 : 0.8;
        this.rocket.position.set(x, y0, 0);
        break;
      }
      default:
        break;
    }
  }

  update(delta: number, elapsed: number) {
    if (this.reducedMotion) return;
    const spin = this.mobile ? 0.05 : 0.08;
    this.rocket.rotation.y += delta * spin;
    if (!this.mobile) {
      this.rocket.position.y += Math.sin(elapsed * 0.9) * 0.0008;
    }
  }
}
