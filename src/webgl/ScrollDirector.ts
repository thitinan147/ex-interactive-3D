export type SectionProgress = {
  id: string;
  t: number;
  global: number;
};

type Listener = (state: SectionProgress) => void;

const SECTION_IDS = [
  "hero",
  "systems",
  "variants",
  "specs",
  "reel",
  "order",
  "footer",
] as const;

export class ScrollDirector {
  private listeners = new Set<Listener>();
  private sections: { id: string; el: HTMLElement }[] = [];
  private raf = 0;
  private last: SectionProgress = { id: "hero", t: 0, global: 0 };

  init() {
    this.sections = SECTION_IDS.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      return { id, el };
    }).filter(Boolean) as { id: string; el: HTMLElement }[];

    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onScroll, { passive: true });
    this.onScroll();
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    fn(this.last);
    return () => this.listeners.delete(fn);
  }

  getState() {
    return this.last;
  }

  dispose() {
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onScroll);
    cancelAnimationFrame(this.raf);
    this.listeners.clear();
  }

  private onScroll = () => {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.measure());
  };

  private measure() {
    const viewH = window.innerHeight || 1;
    const scrollY = window.scrollY;
    const docH = Math.max(
      document.documentElement.scrollHeight - viewH,
      1,
    );
    const global = THREEClamp(scrollY / docH, 0, 1);

    let activeId = this.sections[0]?.id ?? "hero";
    let localT = 0;
    let best = Number.POSITIVE_INFINITY;

    for (const { id, el } of this.sections) {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height * 0.35;
      const dist = Math.abs(mid - viewH * 0.35);
      if (dist < best) {
        best = dist;
        activeId = id;
        const start = -viewH * 0.15;
        const end = viewH * 0.55;
        localT = THREEClamp(1 - (rect.top - start) / (end - start + rect.height * 0.5), 0, 1);
      }
    }

    this.last = { id: activeId, t: localT, global };
    for (const fn of this.listeners) fn(this.last);

    const indicator = document.getElementById("scroll-indicator");
    if (indicator) {
      indicator.classList.toggle("is-hidden", global > 0.92 || activeId === "footer");
    }

    document.querySelectorAll<HTMLElement>(".o-section").forEach((el) => {
      el.classList.toggle("is-active", el.id === activeId);
    });
  }
}

function THREEClamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
