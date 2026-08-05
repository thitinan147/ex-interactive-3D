import gsap from "gsap";
import { prefersReducedMotion } from "./reducedMotion";

type ProgressOpts = {
  minMs?: number;
};

export class Preloader {
  private root: HTMLElement | null;
  private bar: HTMLElement | null;
  private label: HTMLElement | null;
  private brand: HTMLElement | null;
  private sub: HTMLElement | null;
  private mark: HTMLElement | null;
  private progress = 0;
  private startedAt = 0;
  private minMs: number;
  private reduced: boolean;
  private pulse?: gsap.core.Tween;

  constructor(opts: ProgressOpts = {}) {
    this.root = document.getElementById("preloader");
    this.bar = document.querySelector("#preloader .preloader-bar > i");
    this.label = document.querySelector("#preloader .preloader-pct");
    this.brand = document.querySelector("#preloader .preloader-brand");
    this.sub = document.querySelector("#preloader .preloader-sub");
    this.mark = document.querySelector("#preloader .preloader-mark");
    this.reduced = prefersReducedMotion();
    this.minMs = this.reduced ? 0 : (opts.minMs ?? 1100);
  }

  start() {
    this.startedAt = performance.now();
    document.documentElement.classList.add("is-loading");
    if (this.root) this.root.setAttribute("aria-busy", "true");

    if (!this.reduced && this.mark) {
      gsap.set(this.mark, { scale: 0.85, opacity: 0 });
      gsap.to(this.mark, {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
      });
      this.pulse = gsap.to(".preloader-ring", {
        rotate: 360,
        duration: 3.2,
        ease: "none",
        repeat: -1,
      });
    }

    this.setProgress(8);
  }

  setProgress(pct: number) {
    this.progress = Math.max(this.progress, Math.min(100, pct));
    if (this.bar) {
      gsap.to(this.bar, {
        width: `${this.progress}%`,
        duration: this.reduced ? 0 : 0.4,
        ease: "power2.out",
        overwrite: true,
      });
    }
    if (this.label) {
      this.label.textContent = `${Math.round(this.progress)}%`;
    }
  }

  markReady() {
    this.setProgress(100);
  }

  async finish(): Promise<void> {
    this.markReady();
    const elapsed = performance.now() - this.startedAt;
    const wait = Math.max(0, this.minMs - elapsed);
    if (wait > 0) {
      await new Promise((r) => window.setTimeout(r, wait));
    }
    await this.exit();
  }

  private exit(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.root) {
        document.documentElement.classList.remove("is-loading");
        resolve();
        return;
      }

      if (this.reduced) {
        this.pulse?.kill();
        this.root.classList.add("is-done");
        this.root.setAttribute("aria-busy", "false");
        document.documentElement.classList.remove("is-loading");
        resolve();
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          this.pulse?.kill();
          this.root?.classList.add("is-done");
          this.root?.setAttribute("aria-busy", "false");
          document.documentElement.classList.remove("is-loading");
          gsap.set(this.root, { clearProps: "opacity,visibility" });
          resolve();
        },
      });

      tl.to(this.mark, { scale: 1.08, opacity: 0, duration: 0.4 }, 0)
        .to(
          [this.brand, this.sub, this.label].filter(Boolean),
          { opacity: 0, y: -10, duration: 0.35, stagger: 0.04 },
          0.05,
        )
        .to(
          this.bar?.parentElement ?? null,
          { opacity: 0, scaleX: 0.9, duration: 0.32 },
          0.1,
        )
        .to(this.root, { opacity: 0, duration: 0.55 }, 0.2)
        .set(this.root, { visibility: "hidden", pointerEvents: "none" });
    });
  }
}

export function runBootProgress(
  preloader: Preloader,
  steps: number[],
  stepMs = 160,
): { cancel: () => void } {
  if (prefersReducedMotion()) {
    return { cancel: () => undefined };
  }
  let i = 0;
  let id = 0;
  const tick = () => {
    if (i >= steps.length) return;
    preloader.setProgress(steps[i]);
    i += 1;
    id = window.setTimeout(tick, stepMs);
  };
  id = window.setTimeout(tick, stepMs);
  return { cancel: () => window.clearTimeout(id) };
}
