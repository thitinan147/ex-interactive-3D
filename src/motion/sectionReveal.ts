import gsap from "gsap";
import { prefersReducedMotion } from "./reducedMotion";

export type SectionRevealHandle = {
  revealHeroNow: () => void;
  dispose: () => void;
};

export function initSectionReveal(): SectionRevealHandle {
  const reduced = prefersReducedMotion();
  const items = Array.from(
    document.querySelectorAll<HTMLElement>(".js-reveal"),
  );

  if (items.length === 0) {
    return { revealHeroNow: () => undefined, dispose: () => undefined };
  }

  if (reduced) {
    items.forEach((el) => {
      el.classList.add("is-revealed");
      gsap.set(el, { clearProps: "opacity,transform" });
    });
    return { revealHeroNow: () => undefined, dispose: () => undefined };
  }

  gsap.set(items, { opacity: 0, y: 28 });

  const revealed = new WeakSet<Element>();
  const observers: IntersectionObserver[] = [];

  const play = (els: HTMLElement[]) => {
    const pending = els.filter((el) => !revealed.has(el));
    if (pending.length === 0) return;
    pending.forEach((el) => revealed.add(el));
    gsap.to(pending, {
      opacity: 1,
      y: 0,
      duration: 0.85,
      stagger: 0.07,
      ease: "power3.out",
      onStart: () => {
        pending.forEach((el) => el.classList.add("is-revealed"));
      },
    });
  };

  const heroItems = items.filter((el) => el.closest("#hero"));
  const restItems = items.filter((el) => !el.closest("#hero"));

  const sections = new Map<Element, HTMLElement[]>();
  for (const el of restItems) {
    const section = el.closest(".o-section");
    if (!section) continue;
    const list = sections.get(section) ?? [];
    list.push(el);
    sections.set(section, list);
  }

  for (const [section, els] of sections) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          play(els);
          io.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(section);
    observers.push(io);
  }

  return {
    revealHeroNow: () => play(heroItems),
    dispose: () => {
      observers.forEach((o) => o.disconnect());
    },
  };
}
