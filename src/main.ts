import { applyReducedMotionClass } from "./motion/reducedMotion";
import { Preloader, runBootProgress } from "./motion/preloader";
import { initSectionReveal } from "./motion/sectionReveal";
import { bindWaitlistForm } from "./motion/waitlistForm";
import { bindVideoOverlay } from "./motion/videoOverlay";
import { bindAnalyticsClicks, track } from "./lib/analytics";
import type { WebGLApp } from "./webgl/App";

let app: WebGLApp | null = null;
let revealDispose: (() => void) | null = null;

function bindVariants(instance: WebGLApp) {
  const cards = document.querySelectorAll<HTMLElement>("[data-variant]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.variant as "standard" | "heavy" | "reusable";
      cards.forEach((c) => c.classList.toggle("is-active", c === card));
      instance.setVariant(id);
      track("variant_select", { variant: id });
    });
  });
}

function setVhUnit() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

async function init() {
  applyReducedMotionClass();
  setVhUnit();
  window.addEventListener("resize", setVhUnit, { passive: true });

  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) return;

  const isMobile = window.matchMedia("(max-width: 767.98px)").matches;
  const preloader = new Preloader({ minMs: isMobile ? 700 : 1000 });
  preloader.start();
  const boot = runBootProgress(
    preloader,
    [12, 28, 44, 58, 70],
    isMobile ? 100 : 140,
  );

  const reveal = initSectionReveal();
  revealDispose = reveal.dispose;

  bindAnalyticsClicks();
  bindVideoOverlay();
  bindWaitlistForm();
  track("page_view", { mobile: isMobile });

  try {
    preloader.setProgress(35);
    const { WebGLApp } = await import("./webgl/App");
    preloader.setProgress(78);
    app = new WebGLApp(canvas);
    preloader.setProgress(94);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    preloader.setProgress(100);
  } catch (err) {
    console.error(err);
    preloader.setProgress(100);
  } finally {
    boot.cancel();
  }

  if (app) bindVariants(app);

  await preloader.finish();
  reveal.revealHeroNow();
  track("experience_ready", { mobile: isMobile });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      revealDispose?.();
      app?.dispose();
      app = null;
    });
  }
}

init();
