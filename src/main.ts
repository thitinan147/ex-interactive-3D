import gsap from "gsap";
import { WebGLApp } from "./webgl/App";

let app: WebGLApp | null = null;

function setPreloaderProgress(pct: number) {
  const bar = document.querySelector<HTMLElement>("#preloader .preloader-bar > i");
  const label = document.querySelector<HTMLElement>("#preloader .preloader-pct");
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${Math.round(pct)}%`;
}

function hidePreloader() {
  const el = document.getElementById("preloader");
  if (!el) return;
  el.classList.add("is-done");
  el.setAttribute("aria-busy", "false");
}

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

function bindOrderForm() {
  const form = document.querySelector<HTMLFormElement>("#order-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    if (!btn) return;
    const prev = btn.textContent;
    btn.textContent = "Registered";
    window.setTimeout(() => {
      if (prev) btn.textContent = prev;
      form.reset();
    }, 2200);
  });
}

function introCopy() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = document.querySelectorAll(".js-reveal");
  if (reduced) {
    targets.forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
    });
    return;
  }

  gsap.set(targets, { opacity: 0, y: 18 });
  gsap.to(targets, {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power3.out",
    delay: 0.15,
  });
}

function init() {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) return;

  setPreloaderProgress(18);
  app = new WebGLApp(canvas);
  setPreloaderProgress(100);

  bindVariants(app);
  bindVideoOverlay();
  bindOrderForm();

  window.setTimeout(() => {
    hidePreloader();
    introCopy();
  }, 320);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      app?.dispose();
      app = null;
    });
  }
}

init();
