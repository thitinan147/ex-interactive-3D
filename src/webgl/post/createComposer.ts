import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

export type PostStack = {
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  fxaa: ShaderPass;
  setSize: (w: number, h: number, dpr: number) => void;
  dispose: () => void;
};

export function createPostStack(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): PostStack {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(size.x, size.y),
    0.08,
    0.28,
    0.94,
  );
  composer.addPass(bloom);

  const fxaa = new ShaderPass(FXAAShader);
  const dpr = renderer.getPixelRatio();
  fxaa.material.uniforms["resolution"].value.set(
    1 / (size.x * dpr),
    1 / (size.y * dpr),
  );
  composer.addPass(fxaa);

  composer.addPass(new OutputPass());

  return {
    composer,
    bloom,
    fxaa,
    setSize(w, h, pixelRatio) {
      composer.setSize(w, h);
      composer.setPixelRatio(pixelRatio);
      bloom.resolution.set(w, h);
      fxaa.material.uniforms["resolution"].value.set(
        1 / (w * pixelRatio),
        1 / (h * pixelRatio),
      );
    },
    dispose() {
      composer.dispose();
    },
  };
}
