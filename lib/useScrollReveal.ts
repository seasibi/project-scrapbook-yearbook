"use client";

import { useEffect } from "react";

/**
 * Progressive-enhancement scroll reveal. Elements with `.reveal` are only
 * hidden once `body.js-ready` is set on mount, so content stays visible
 * without JS. A MutationObserver picks up elements mounted later (countdown
 * gate unlock, the SSR-disabled flipbook), and an 800ms fallback forces
 * `.visible` on anything in the viewport the observer missed.
 */
export function useScrollReveal() {
  useEffect(() => {
    document.body.classList.add("js-ready");

    const tracked = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    let fallbackPending = false;
    const forceInViewport = () => {
      fallbackPending = false;
      document.querySelectorAll<HTMLElement>(".reveal:not(.visible)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("visible");
        }
      });
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>(".reveal:not(.visible)").forEach((el) => {
        if (!tracked.has(el)) {
          tracked.add(el);
          io.observe(el);
        }
      });
      if (!fallbackPending) {
        fallbackPending = true;
        window.setTimeout(forceInViewport, 800);
      }
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
