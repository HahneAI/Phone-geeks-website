import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smooth-scrolls so `target`'s top clears the site's sticky header (and any
 * other currently-sticky elements passed in `stickyEls`, e.g. a sticky
 * sub-nav) plus a small breathing-room gap. Scroll-margin-top can't do this
 * reliably when a sticky element's height varies (e.g. a nav that wraps to
 * a different number of rows per viewport), so this measures the real
 * rendered heights at click time instead.
 */
export function scrollPastSticky(
  target: HTMLElement,
  stickyEls: (HTMLElement | null)[] = [],
  gap = 16
) {
  const header = document.querySelector("header");
  const stickyHeight = [header, ...stickyEls].reduce(
    (sum, el) => sum + (el?.getBoundingClientRect().height ?? 0),
    0
  );
  const top =
    target.getBoundingClientRect().top + window.scrollY - stickyHeight - gap;
  window.scrollTo({ top, behavior: "smooth" });
}
