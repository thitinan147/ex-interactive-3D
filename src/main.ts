import { WebGLApp } from "./webgl/App";
import { applyReducedMotionClass } from "./motion/reducedMotion";
import { Preloader, runBootProgress } from "./motion/preloader";
import { initSectionReveal } from "./motion/sectionReveal";
import { bindWaitlistForm } from "./motion/waitlistForm";

let app: WebGLApp | null = null;
let revealDispose: (() => void) | null = null;

function bindVariants(instance: WebGLApp) {
  const cards = document.querySelectorAll<HTMLElement>("[data-variant]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.variant as "standard" | "heavy" | "reusable";
      cards.forEach((c) => c.classList.toggle("is-active", c === card));
      instance.setVariant(id);
    });
  });
}

function bindVideoOverlay() {
  const overlay = document.getElementById("video-overlay");
  const openers = document.querySelectorAll("[data-open-reel]");
  const closer = document.querySelector("[data-close-reel]");
  if (!overlay) return;

  const open = () => {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
  };

  openers.forEach((btn) => btn.addEventListener("click", open));
  closer?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

async function init() {
  applyReducedMotionClass();

  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) return;

  const preloader = new Preloader({ minMs: 1000 });
  preloader.start();
  const boot = runBootProgress(preloader, [18, 36, 52, 68, 82], 140);

  const reveal = initSectionReveal();
  revealDispose = reveal.dispose;

  try {
    app = new WebGLApp(canvas);
    preloader.setProgress(92);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    preloader.setProgress(100);
  } catch {
    preloader.setProgress(100);
  } finally {
    boot.cancel();
  }

  if (app) bindVariants(app);
  bindVideoOverlay();
  bindWaitlistForm();

  await preloader.finish();
  reveal.revealHeroNow();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      revealDispose?.();
      app?.dispose();
      app = null;
    });
  }
}

init();
