export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyReducedMotionClass() {
  document.documentElement.classList.toggle(
    "is-reduced-motion",
    prefersReducedMotion(),
  );
}
