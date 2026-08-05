type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    __v9Track?: (event: string, props?: Props) => void;
  }
}

const QUEUE_KEY = "__v9aq";

function pushDataLayer(event: string, props: Props = {}) {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...props });
}

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    event,
    ts: Date.now(),
    path: window.location.pathname,
    ...props,
  };

  pushDataLayer(event, props);

  const w = window as Window & { [QUEUE_KEY]?: unknown[] };
  w[QUEUE_KEY] = w[QUEUE_KEY] || [];
  w[QUEUE_KEY]!.push(payload);

  window.__v9Track?.(event, props);

  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, props);
  }
}

export function bindAnalyticsClicks() {
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-track]",
      );
      if (!el) return;
      const name = el.dataset.track;
      if (!name) return;
      track(name, {
        label: el.dataset.trackLabel ?? el.textContent?.trim().slice(0, 48),
      });
    },
    { passive: true },
  );
}
