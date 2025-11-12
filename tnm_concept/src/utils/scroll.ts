export function getScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return "auto";
      }
    } catch {
      // If matchMedia throws (very old browsers), fall back to smooth scrolling
    }
  }

  return "smooth";
}
