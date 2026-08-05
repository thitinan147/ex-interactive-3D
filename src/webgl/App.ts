import * as THREE from "three";
import { HeroScene } from "./scenes/HeroScene";
import { ScrollDirector } from "./ScrollDirector";

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

  private camTarget = new THREE.Vector3(0.4, 0.4, 0);
  private camPos = new THREE.Vector3(0, 0.35, 7.0);
  private lookAt = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement) {
    this.isMobile = window.matchMedia("(max-width: 767.98px)").matches;
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2),
    );
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 42 : 35,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.camera.position.copy(this.camPos);

    this.scene.fog = new THREE.FogExp2(0x0b0d10, 0.018);

    this.setupLights();
    this.hero = new HeroScene(this.reducedMotion);
    if (this.isMobile) {
      this.hero.rocket.position.x = 0;
      this.hero.rocket.scale.setScalar(0.85);
    }
    this.scene.add(this.hero.group);

    this.scroll.init();
    this.scroll.on((state) => {
      this.hero.setProgress(state.id, state.t);
      this.updateCameraForSection(state.id, state.t);
    });

    window.addEventListener("resize", this.onResize);
    this.raf = requestAnimationFrame(this.tick);
  }

  setVariant(id: "standard" | "heavy" | "reusable") {
    this.hero.setVariant(id);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
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

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xc5d0dc, 0.55);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff4e8, 1.7);
    key.position.set(4, 6, 5);
    key.castShadow = !this.isMobile;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 30;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x3dd6c6, 0.55);
    rim.position.set(-5, 2, -3);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0x8ea0b8, 0.35);
    fill.position.set(-2, 1, 4);
    this.scene.add(fill);

    const ember = new THREE.PointLight(0xff5a1f, 0.55, 14, 2);
    ember.position.set(0.4, -2.2, 1.4);
    this.scene.add(ember);

    const hemi = new THREE.HemisphereLight(0xdde7f2, 0x1a1510, 0.35);
    this.scene.add(hemi);
  }

  private updateCameraForSection(id: string, t: number) {
    const mobile = this.isMobile;
    const baseZ = mobile ? 8.0 : 7.0;
    const baseX = mobile ? 0 : 0.2;

    switch (id) {
      case "hero":
        this.camPos.set(baseX, 0.35 + t * 0.15, baseZ - t * 0.35);
        this.camTarget.set(mobile ? 0 : 0.55, 0.15, 0);
        break;
      case "systems":
        this.camPos.set(baseX + 0.35, 0.15, baseZ - 0.6);
        this.camTarget.set(mobile ? 0 : 0.4, 0.0, 0);
        break;
      case "variants":
        this.camPos.set(baseX - 0.15, 0.3, baseZ - 0.25);
        this.camTarget.set(mobile ? 0 : 0.5, 0.1, 0);
        break;
      case "specs":
        this.camPos.set(baseX + 0.7, 0.9, baseZ - 0.9);
        this.camTarget.set(0.2, 0.1, 0);
        break;
      default:
        this.camPos.set(baseX, 0.3, baseZ);
        this.camTarget.set(mobile ? 0 : 0.45, 0.1, 0);
        break;
    }
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.isMobile = w <= 768;
    this.camera.aspect = w / h;
    this.camera.fov = this.isMobile ? 42 : 35;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2),
    );
    this.renderer.setSize(w, h, false);
  };

  private tick = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.hero.update(delta, elapsed);

    this.camera.position.lerp(this.camPos, 0.06);
    this.lookAt.copy(this.camTarget);
    this.camera.lookAt(this.lookAt);

    this.renderer.render(this.scene, this.camera);
  };
}
