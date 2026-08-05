import gsap from "gsap";
import { prefersReducedMotion } from "./reducedMotion";

export type SectionRevealHandle = {
  revealHeroNow: () => void;
  dispose: () => void;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Split element text into word spans for GSAP (keeps spaces). */
export function splitWords(el: HTMLElement) {
  if (el.dataset.split === "words") return;
  const text = el.textContent ?? "";
  if (!text.trim()) return;
  el.dataset.split = "words";
  el.setAttribute("aria-label", text.trim());
  const parts = text.split(/(\s+)/);
  el.innerHTML = parts
    .map((part) => {
      if (!part) return "";
      if (/^\s+$/.test(part)) return part;
      return `<span class="split-word"><span class="split-word__inner">${escapeHtml(part)}</span></span>`;
    })
    .join("");
}

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

  const revealed = new WeakSet<Element>();
  const observers: IntersectionObserver[] = [];

  // prepare all up front so layout is stable
  items.forEach((el) => {
    if (el.matches("h1,h2,h3,p.o-kicker,p.o-body,.o-title")) splitWords(el);
  });
  gsap.set(document.querySelectorAll(".split-word__inner"), {
    opacity: 0,
    y: 18,
  });
  gsap.set(
    items.filter((el) => !el.querySelector(".split-word")),
    { opacity: 0, y: 28 },
  );

  const play = (els: HTMLElement[]) => {
    const pending = els.filter((el) => !revealed.has(el));
    if (pending.length === 0) return;
    pending.forEach((el) => revealed.add(el));

    const wordHosts = pending.filter((el) => el.querySelector(".split-word"));
    const blocks = pending.filter((el) => !el.querySelector(".split-word"));
    const words = wordHosts.flatMap((el) =>
      Array.from(el.querySelectorAll<HTMLElement>(".split-word__inner")),
    );

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onStart: () => pending.forEach((el) => el.classList.add("is-revealed")),
    });

    if (words.length) {
      tl.to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.018,
        },
        0,
      );
    }
    if (blocks.length) {
      tl.to(
        blocks,
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
        },
        words.length ? 0.08 : 0,
      );
    }
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
