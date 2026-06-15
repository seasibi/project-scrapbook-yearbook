"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Per-element scroll reveal for the framer-motion animation components.
 * (The global class-based reveal for `.reveal` elements lives in
 * `lib/useScrollReveal.ts` — this hook is a different, per-element API.)
 *
 * Progressive enhancement: `isVisible` starts `true` so nothing renders
 * hidden without JS. Once mounted (and `body.js-ready` is set by the shell),
 * it flips to `false` and the IntersectionObserver drives it; an 800ms
 * fallback forces it back to `true` if the observer never fires.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
): { ref: RefObject<T | null>; isVisible: boolean } {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // already in (or above) the viewport — keep it visible, skip the hide
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    setIsVisible(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(el);

    // fallback: never leave content hidden if the observer doesn't fire
    const fallback = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) setIsVisible(true);
    }, 800);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}
