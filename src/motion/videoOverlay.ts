import { track } from "../lib/analytics";

function buildVimeoSrc(id: string, hash?: string) {
  const h = hash ? `&h=${encodeURIComponent(hash)}` : "";
  return `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=1&title=0&byline=0&portrait=0&dnt=1${h}`;
}

export function bindVideoOverlay() {
  const overlay = document.getElementById("video-overlay");
  const frame = document.querySelector<HTMLElement>(
    "#video-overlay .video-overlay__frame",
  );
  const openers = document.querySelectorAll("[data-open-reel]");
  const closer = document.querySelector("[data-close-reel]");
  if (!overlay || !frame) return;

  const localSrc = overlay.dataset.localSrc?.trim() ?? "";
  const poster = overlay.dataset.localPoster?.trim() ?? "";
  const vimeoId = overlay.dataset.vimeoId?.trim() ?? "";
  const vimeoHash = overlay.dataset.vimeoHash?.trim() ?? "";
  const mode = vimeoId ? "vimeo" : localSrc ? "local" : "none";

  let media: HTMLVideoElement | HTMLIFrameElement | null = null;

  const clearMedia = () => {
    if (media instanceof HTMLVideoElement) {
      media.pause();
      media.removeAttribute("src");
      media.load();
    }
    frame.querySelectorAll("video, iframe").forEach((n) => n.remove());
    media = null;
  };

  const mountPlayer = () => {
    clearMedia();
    const placeholder = frame.querySelector<HTMLElement>(
      ".video-overlay__placeholder",
    );

    if (mode === "none") {
      if (placeholder) placeholder.hidden = false;
      return;
    }
    if (placeholder) placeholder.hidden = true;

    if (mode === "local") {
      const video = document.createElement("video");
      video.src = `${localSrc}${localSrc.includes("?") ? "&" : "?"}v=3`;
      if (poster) video.poster = poster;
      video.controls = true;
      video.playsInline = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.preload = "auto";
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.title = "Vektor V-9 launch reel";
      frame.appendChild(video);
      media = video;
      const tryPlay = () =>
        video.play().catch(() => {
          video.muted = true;
          return video.play().catch(() => undefined);
        });
      if (video.readyState >= 2) void tryPlay();
      else video.addEventListener("canplay", () => void tryPlay(), { once: true });
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.src = buildVimeoSrc(vimeoId, vimeoHash || undefined);
    iframe.title = "Vektor V-9 launch reel";
    iframe.allow =
      "autoplay; fullscreen; picture-in-picture; encrypted-media";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.appendChild(iframe);
    media = iframe;
  };

  const open = () => {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    mountPlayer();
    track("reel_open", { mode });
    if (closer instanceof HTMLElement) closer.focus();
  };

  const close = () => {
    clearMedia();
    overlay.hidden = true;
    document.body.style.overflow = "";
    track("reel_close", { mode });
  };

  openers.forEach((btn) => btn.addEventListener("click", open));
  closer?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
}
