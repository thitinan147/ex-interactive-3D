import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HeroScene } from "./scenes/HeroScene";
import { ScrollDirector } from "./ScrollDirector";
import {
  applyLandingCameraBias,
  buildSectionKeys,
  sampleCamKeys,
} from "./cameraRig";
import { createPostStack, type PostStack } from "./post/createComposer";
import { createAtmosphere, type AtmosphereLayer } from "./createAtmosphere";
import { envFromLanding } from "./atmosphereProgress";
import { landingFromSection } from "./landingProgress";

const MOBILE_MQ = "(max-width: 767.98px)";

export class WebGLApp {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private timer = new THREE.Timer();
  private hero: HeroScene;
  private atmosphere: AtmosphereLayer;
  private scroll = new ScrollDirector();
  private post: PostStack | null = null;
  private raf = 0;
  private disposed = false;
  private isMobile: boolean;
  private reducedMotion: boolean;
  private visible = true;
  private needsRender = true;
  private sectionKeys = buildSectionKeys(false);
  private targetFov = 32;
  private hovering = false;
  private ambientLight!: THREE.AmbientLight;
  private keyLight!: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight | null = null;
  private fog!: THREE.FogExp2;

  private camTarget = new THREE.Vector3(1.35, 1.0, 0);
  private camPos = new THREE.Vector3(-1.1, 1.05, 10.6);
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
      antialias: this.isMobile,
      alpha: true,
      powerPreference: this.isMobile ? "default" : "high-performance",
      stencil: false,
      depth: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.isMobile ? 0.9 : 0.82;
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    this.timer.connect(document);

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 38 : 32,
      window.innerWidth / window.innerHeight,
      0.1,
      120,
    );
    this.camera.position.copy(this.camPos);
    this.targetFov = this.camera.fov;

    this.fog = new THREE.FogExp2(0x05060a, this.isMobile ? 0.022 : 0.016);
    this.scene.fog = this.fog;
    this.renderer.setClearColor(0x05060a, 0);

    if (!this.isMobile) {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(
        new RoomEnvironment(),
        0.02,
      ).texture;
      this.scene.environmentIntensity = 0.28;
      pmrem.dispose();
      this.post = createPostStack(this.renderer, this.scene, this.camera);
    }

    this.setupLights();
    const quality = this.isMobile ? "low" : "high";
    this.hero = new HeroScene(this.reducedMotion, quality);
    this.atmosphere = createAtmosphere(quality);
    this.sectionKeys = buildSectionKeys(this.isMobile);
    this.applyRocketFraming();
    this.scene.add(this.hero.group);
    this.scene.add(this.atmosphere.group);

    this.scroll.init();
    this.scroll.on((state) => {
      this.hero.setProgress(state.id, state.t);
      this.updateCameraForSection(state.id, state.t);
      this.applyEnvironment(landingFromSection(state.id, state.t));
      this.needsRender = true;
    });

    this.updateCameraForSection("hero", 0);
    this.hero.setProgress("hero", 0);
    this.applyEnvironment(0);
    this.camera.position.copy(this.camPos);
    this.camera.fov = this.targetFov;
    this.camera.updateProjectionMatrix();

    window.addEventListener("resize", this.onResize, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerleave", this.onPointerLeave, {
      passive: true,
    });
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
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerleave", this.onPointerLeave);
    this.scroll.dispose();
    this.timer.disconnect();
    this.post?.dispose();
    this.atmosphere.dispose();
    this.renderer.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      }
    });
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.isMobile || this.reducedMotion) return;
    const t = e.target;
    if (t instanceof Element) {
      if (t.closest("a,button,input,select,label,textarea,.is-interactive")) {
        this.hero.setPointer(0, 0, false);
        this.setHoverCursor(false);
        return;
      }
    }
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = -(e.clientY / window.innerHeight) * 2 + 1;
    this.hero.setPointer(nx, ny, true);
    const hit = this.hero.pick(this.camera);
    this.hero.setPointer(nx, ny, hit);
    this.setHoverCursor(hit);
    this.needsRender = true;
  };

  private onPointerLeave = () => {
    this.hero.setPointer(0, 0, false);
    this.setHoverCursor(false);
  };

  private setHoverCursor(on: boolean) {
    if (this.hovering === on) return;
    this.hovering = on;
    document.documentElement.classList.toggle("is-rocket-hover", on);
  }

  private onVisibility = () => {
    this.visible = document.visibilityState === "visible";
    if (this.visible) {
      this.timer.update();
      this.needsRender = true;
      if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  private setupLights() {
    this.ambientLight = new THREE.AmbientLight(
      0x8a9199,
      this.isMobile ? 0.22 : 0.14,
    );
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(
      0xe8e4dc,
      this.isMobile ? 0.85 : 0.9,
    );
    this.keyLight.position.set(5.5, 7.5, 4.5);
    this.keyLight.castShadow = !this.isMobile;
    if (!this.isMobile) {
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 0.5;
      this.keyLight.shadow.camera.far = 30;
      this.keyLight.shadow.bias = -0.0002;
    }
    this.scene.add(this.keyLight);

    const rim = new THREE.DirectionalLight(0x5c6670, this.isMobile ? 0.18 : 0.2);
    rim.position.set(-6, 3, -4);
    this.scene.add(rim);

    if (!this.isMobile) {
      const fill = new THREE.DirectionalLight(0x6e7680, 0.12);
      fill.position.set(-3, 1.5, 5);
      this.scene.add(fill);

      const ember = new THREE.PointLight(0xb04e22, 0.2, 3.8, 2.4);
      ember.position.set(0.1, -2.4, 0.4);
      this.scene.add(ember);

      this.hemiLight = new THREE.HemisphereLight(0x1a2030, 0x08090c, 0.08);
      this.scene.add(this.hemiLight);
    } else {
      const ember = new THREE.PointLight(0xb04e22, 0.15, 3.5, 2.2);
      ember.position.set(0, -2.05, 0.45);
      this.scene.add(ember);
      this.hemiLight = new THREE.HemisphereLight(0x1a2030, 0x08090c, 0.06);
      this.scene.add(this.hemiLight);
    }
  }

  /** Space → sky → ocean droneship env (SpaceX ASDS ref) */
  private applyEnvironment(L: number) {
    const env = envFromLanding(L, this.isMobile);
    this.fog.color.copy(env.fogColor);
    this.fog.density = env.fogDensity;
    this.ambientLight.intensity = env.ambient;
    this.keyLight.intensity = env.key;
    if (this.hemiLight) {
      this.hemiLight.color.copy(env.hemiSky);
      this.hemiLight.groundColor.copy(env.hemiGround);
      this.hemiLight.intensity = env.hemiIntensity;
    }
    this.renderer.toneMappingExposure = env.exposure;
    if (this.scene.environment) {
      this.scene.environmentIntensity = THREE.MathUtils.lerp(0.18, 0.38, env.ocean);
    }
    this.atmosphere.setProgress(env.stars, env.sky);
    document.documentElement.style.setProperty("--env-bg", env.cssBg);
    document.documentElement.dataset.env =
      env.ocean > 0.55 ? "ocean" : env.sky > 0.35 ? "sky" : "space";
  }

  private applyRocketFraming() {
    const mobile = this.isMobile;
    const scale = this.baseRocketScale * (mobile ? 0.68 : 1);
    this.hero.setMobile(mobile);
    this.hero.setBaseScale(scale);
  }

  private updateCameraForSection(id: string, t: number) {
    const keys = this.sectionKeys[id] ?? this.sectionKeys.hero;
    const fov = sampleCamKeys(keys, t, this.camPos, this.camTarget);
    applyLandingCameraBias(id, t, this.isMobile, this.camPos, this.camTarget);
    if (fov != null) this.targetFov = fov;
  }

  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const wasMobile = this.isMobile;
    this.isMobile = w <= 768;
    this.sectionKeys = buildSectionKeys(this.isMobile);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.post?.setSize(w, h, dpr);
    this.applyRocketFraming();
    if (wasMobile !== this.isMobile) {
      this.renderer.shadowMap.enabled = !this.isMobile;
      this.renderer.toneMappingExposure = this.isMobile ? 0.9 : 0.82;
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

    this.timer.update();
    const delta = this.timer.getDelta();
    const elapsed = this.timer.getElapsed();

    this.hero.update(delta, elapsed);

    const camLerp = this.reducedMotion ? 1 : 0.07;
    this.camera.position.lerp(this.camPos, camLerp);
    this.lookAt.lerp(this.camTarget, camLerp);
    this.camera.lookAt(this.lookAt);

    const fovLerp = this.reducedMotion ? 1 : 0.06;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.targetFov, fovLerp);
    this.camera.updateProjectionMatrix();

    if (this.post && !this.isMobile) {
      this.post.bloom.strength = 0.07 + (this.hovering ? 0.02 : 0);
      this.post.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };
}
