import * as THREE from "three";
import { HeroScene } from "./scenes/HeroScene";
import { ScrollDirector } from "./ScrollDirector";

const MOBILE_MQ = "(max-width: 767.98px)";

export class WebGLApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private hero: HeroScene;
  private scroll = new ScrollDirector();
  private raf = 0;
  private disposed = false;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private visible = true;
  private needsRender = true;

  private camTarget = new THREE.Vector3(0.55, 0.05, 0);
  private camPos = new THREE.Vector3(0.15, 0.1, 9.2);
  private lookAt = new THREE.Vector3();
  private readonly baseRocketScale = 0.5;

  constructor(private canvas: HTMLCanvasElement) {
    this.isMobile = window.matchMedia(MOBILE_MQ).matches;
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dprCap = this.isMobile ? 1.25 : 2;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: this.isMobile ? "default" : "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.isMobile ? 1.1 : 1.2;
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 38 : 32,
      window.innerWidth / window.innerHeight,
      0.1,
      80,
    );
    this.camera.position.copy(this.camPos);

    this.scene.fog = new THREE.FogExp2(0x0b0d10, this.isMobile ? 0.02 : 0.014);

    this.setupLights();
    this.hero = new HeroScene(
      this.reducedMotion,
      this.isMobile ? "low" : "high",
    );
    this.applyRocketFraming();
    this.scene.add(this.hero.group);

    this.scroll.init();
    this.scroll.on((state) => {
      this.hero.setProgress(state.id, state.t);
      this.updateCameraForSection(state.id, state.t);
      this.needsRender = true;
    });

    this.updateCameraForSection("hero", 0);
    this.hero.setProgress("hero", 0);
    this.camera.position.copy(this.camPos);

    window.addEventListener("resize", this.onResize, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    this.raf = requestAnimationFrame(this.tick);
  }

  setVariant(id: "standard" | "heavy" | "reusable") {
    this.hero.setVariant(id);
    this.needsRender = true;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.scroll.dispose();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }

  private onVisibility = () => {
    this.visible = document.visibilityState === "visible";
    if (this.visible) {
      this.clock.getDelta();
      this.needsRender = true;
      if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xc5d0dc, this.isMobile ? 0.65 : 0.55);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4e8, this.isMobile ? 1.35 : 1.7);
    key.position.set(4, 6, 5);
    key.castShadow = !this.isMobile;
    if (!this.isMobile) {
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 30;
    }
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x3dd6c6, this.isMobile ? 0.4 : 0.55);
    rim.position.set(-5, 2, -3);
    this.scene.add(rim);

    if (!this.isMobile) {
      const fill = new THREE.DirectionalLight(0x8ea0b8, 0.35);
      fill.position.set(-2, 1, 4);
      this.scene.add(fill);

      const ember = new THREE.PointLight(0xff5a1f, 0.55, 14, 2);
      ember.position.set(0.4, -2.2, 1.4);
      this.scene.add(ember);

      const hemi = new THREE.HemisphereLight(0xdde7f2, 0x1a1510, 0.35);
      this.scene.add(hemi);
    } else {
      const ember = new THREE.PointLight(0xff5a1f, 0.35, 10, 2);
      ember.position.set(0, -1.8, 1.2);
      this.scene.add(ember);
    }
  }

  private applyRocketFraming() {
    const mobile = this.isMobile;
    const scale = this.baseRocketScale * (mobile ? 0.68 : 1);
    this.hero.setMobile(mobile);
    this.hero.rocket.scale.setScalar(scale);
    this.hero.rocket.position.x = mobile ? 0 : 1.05;
  }

  private updateCameraForSection(id: string, t: number) {
    const mobile = this.isMobile;
    const baseZ = mobile ? 12.2 : 9.2;
    const baseX = mobile ? 0 : 0.15;
    const lookY = mobile ? -0.2 : 0.05;

    switch (id) {
      case "hero":
        this.camPos.set(baseX, mobile ? 0.05 : 0.1 + t * 0.08, baseZ - t * 0.2);
        this.camTarget.set(mobile ? 0 : 0.55, lookY, 0);
        break;
      case "systems":
        this.camPos.set(baseX + (mobile ? 0 : 0.2), mobile ? 0 : 0.05, baseZ - 0.3);
        this.camTarget.set(mobile ? 0 : 0.45, lookY, 0);
        break;
      case "variants":
        this.camPos.set(baseX, mobile ? 0.08 : 0.12, baseZ - 0.12);
        this.camTarget.set(mobile ? 0 : 0.5, lookY, 0);
        break;
      case "specs":
        this.camPos.set(
          baseX + (mobile ? 0.15 : 0.45),
          mobile ? 0.35 : 0.55,
          baseZ - (mobile ? 0.25 : 0.55),
        );
        this.camTarget.set(mobile ? 0 : 0.25, lookY, 0);
        break;
      default:
        this.camPos.set(baseX, mobile ? 0.05 : 0.1, baseZ);
        this.camTarget.set(mobile ? 0 : 0.5, lookY, 0);
        break;
    }
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const wasMobile = this.isMobile;
    this.isMobile = w <= 768;
    this.camera.aspect = w / h;
    this.camera.fov = this.isMobile ? 38 : 32;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2),
    );
    this.renderer.setSize(w, h, false);
    this.applyRocketFraming();
    if (wasMobile !== this.isMobile) {
      this.renderer.shadowMap.enabled = !this.isMobile;
      this.renderer.toneMappingExposure = this.isMobile ? 1.1 : 1.2;
    }
    this.needsRender = true;
  };

  private tick = () => {
    if (this.disposed) return;
    if (!this.visible) {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.tick);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.hero.update(delta, elapsed);

    if (this.reducedMotion) {
      this.camera.position.copy(this.camPos);
    } else {
      this.camera.position.lerp(this.camPos, 0.06);
    }
    this.lookAt.copy(this.camTarget);
    this.camera.lookAt(this.lookAt);

    this.renderer.render(this.scene, this.camera);
  };
}
