import * as THREE from "three";
import { createRocketModel, type RocketModel } from "../models/createRocketModel";

export class HeroScene {
  readonly group = new THREE.Group();
  readonly rocket: RocketModel;

  private readonly reducedMotion: boolean;

  constructor(reducedMotion = false) {
    this.reducedMotion = reducedMotion;
    this.rocket = createRocketModel();
    this.rocket.position.set(0.95, 0.05, 0);
    this.rocket.rotation.y = -0.4;
    this.rocket.rotation.z = 0.03;
    this.group.add(this.rocket);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(5.2, 64),
      new THREE.MeshStandardMaterial({
        color: 0x10141a,
        metalness: 0.15,
        roughness: 0.92,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.35;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  setVariant(id: "standard" | "heavy" | "reusable") {
    this.rocket.setVariant(id);
  }

  setProgress(sectionId: string, t: number) {
    const k = THREE.MathUtils.clamp(t, 0, 1);

    switch (sectionId) {
      case "hero": {
        this.rocket.rotation.y = -0.45 + k * 0.3;
        this.rocket.position.y = -0.15 + k * 0.2;
        this.rocket.setExplode(0);
        break;
      }
      case "systems": {
        this.rocket.rotation.y = -0.15 + k * 0.35;
        this.rocket.position.y = 0.05;
        this.rocket.setExplode(k);
        break;
      }
      case "variants": {
        this.rocket.setExplode(0);
        this.rocket.rotation.y = 0.25 + k * 0.45;
        this.rocket.position.y = -0.05;
        break;
      }
      case "specs": {
        this.rocket.setExplode(0);
        this.rocket.rotation.y = 0.75;
        this.rocket.rotation.x = -0.12 * k;
        this.rocket.position.y = 0;
        break;
      }
      case "reel":
      case "order":
      case "footer": {
        this.rocket.setExplode(0);
        this.rocket.rotation.x = 0;
        this.rocket.rotation.y = 0.9;
        this.rocket.position.y = -0.1;
        break;
      }
      default:
        break;
    }
  }

  update(delta: number, elapsed: number) {
    if (this.reducedMotion) return;
    this.rocket.rotation.y += delta * 0.08;
    this.rocket.position.y += Math.sin(elapsed * 0.9) * 0.0008;
  }
}
