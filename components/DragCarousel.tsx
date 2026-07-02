"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import styles from "@/app/carousel/carousel.module.css";

/**
 * Physics-based infinite horizontal carousel.
 *
 * Motion model: a single `pos` value is the source of truth for the strip's
 * offset. When idle it drifts leftward every tick (autoplay); a GSAP Draggable
 * (type "x") + InertiaPlugin lets the user grab/flick it, driving `pos` during
 * interaction and handing back to autoplay when the throw settles.
 *
 * Layout: slides have a fixed HEIGHT and a width derived from each image's own
 * aspect ratio, so landscape photos get wider frames and show in full (no crop).
 * Each slide is positioned individually at its cumulative offset and wrapped by
 * the strip's total width, so it tiles seamlessly and loops infinitely. Because
 * every *visible* slide always carries a small transform (offscreen slides wrap
 * far away and are culled), the browser rasters them reliably.
 * No CSS transitions / keyframes / scroll-snap.
 */
export default function DragCarousel({ photos }: { photos: string[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || photos.length < 2) return;

    gsap.registerPlugin(Draggable, InertiaPlugin);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const AUTOPLAY_PX_PER_SEC = 55; // leftward drift speed when idle

    // GSAP's ghost-drag guard: stop the browser's native image drag so it
    // never competes with Draggable's pointer listener.
    const preventImgDrag = (e: Event) => e.preventDefault();
    track.addEventListener("dragstart", preventImgDrag);

    const proxy = document.createElement("div");
    let drag: Draggable | undefined;
    let render: (pos: number) => void = () => {};
    const state = { pos: 0 }; // preserved across rebuilds (resize / image load)

    function build() {
      const slides = Array.from(
        track!.querySelectorAll<HTMLElement>(`.${styles.slide}`)
      );
      const count = slides.length;
      if (count < 2) return;

      const rootFont = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      const gap = rootFont * 1.5; // matches --dc-gap: 1.5rem
      const height = slides[0].getBoundingClientRect().height;

      // Width per slide comes from the image's aspect ratio (clamped so a
      // panorama or a very tall crop can't get absurd). Portraits stay narrow,
      // landscapes get wider — the whole image is shown, never cropped.
      const widths: number[] = slides.map((s) => {
        const img = s.querySelector("img");
        let aspect = 3 / 4;
        if (img && img.naturalWidth && img.naturalHeight) {
          aspect = img.naturalWidth / img.naturalHeight;
        }
        aspect = gsap.utils.clamp(0.5, 2.2, aspect);
        const w = height * aspect;
        s.style.width = `${w}px`;
        return w;
      });

      // cumulative offsets → the strip's total width is the loop period
      const offsets: number[] = [];
      let acc = 0;
      for (let i = 0; i < count; i++) {
        offsets.push(acc);
        acc += widths[i] + gap;
      }
      const total = acc;
      const maxW = Math.max(...widths);

      // A slide wraps only once it is fully off the left edge (its left is more
      // than maxW+gap negative), then reappears one full period to the right —
      // offscreen — and drifts back in. Seamless in both directions.
      const wrapItem = gsap.utils.wrap(-(maxW + gap), total - (maxW + gap));

      render = (pos: number) => {
        for (let i = 0; i < count; i++) {
          gsap.set(slides[i], { x: wrapItem(offsets[i] + pos) });
        }
      };

      render(state.pos);
      // guarantee the initial transforms are flushed to a paint on the next
      // frame (covers browsers that batch the very first gsap.set)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => render(state.pos))
      );
    }

    build();

    drag = Draggable.create(proxy, {
      type: "x",
      trigger: viewport,
      allowNativeTouchScrolling: false,
      dragClickables: true,
      inertia: !prefersReduced,
      onPressInit() {
        // continue the drag from wherever autoplay has drifted to, so grabbing
        // the strip doesn't jump. onPressInit runs before Draggable records the
        // start position.
        gsap.set(proxy, { x: state.pos });
      },
      onDrag() {
        if (Number.isFinite(this.x)) state.pos = this.x;
        render(state.pos);
      },
      onThrowUpdate() {
        if (Number.isFinite(this.x)) state.pos = this.x;
        render(state.pos);
      },
      onThrowComplete() {
        if (Number.isFinite(this.x)) state.pos = this.x; // autoplay resumes next tick
      },
    })[0];

    // autoplay: drift left when the user isn't pressing or mid-throw. A
    // self-managed rAF loop (with a clamped real-time delta) keeps the speed
    // frame-rate independent and resilient to tab backgrounding.
    let rafId = 0;
    let lastT = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(now - lastT, 50);
      lastT = now;
      if (!prefersReduced && drag && !drag.isPressed && !drag.isThrowing) {
        state.pos -= (AUTOPLAY_PX_PER_SEC * dt) / 1000;
        render(state.pos);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    // rebuild once images finish loading (their widths may change) and on
    // resize (height/gap change). state.pos is preserved so nothing jumps.
    let rebuildTimer: number | undefined;
    const scheduleRebuild = () => {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(build, 120);
    };
    const imgs = Array.from(track.querySelectorAll("img"));
    imgs.forEach((im) => {
      if (!(im.complete && im.naturalWidth)) {
        im.addEventListener("load", scheduleRebuild, { once: true });
        im.addEventListener("error", scheduleRebuild, { once: true });
      }
    });
    window.addEventListener("resize", scheduleRebuild);

    return () => {
      window.clearTimeout(rebuildTimer);
      window.removeEventListener("resize", scheduleRebuild);
      track.removeEventListener("dragstart", preventImgDrag);
      cancelAnimationFrame(rafId);
      drag?.kill();
      gsap.killTweensOf(proxy);
    };
  }, [photos]);

  return (
    <div className={styles.stage}>
      <h1 className={styles.heading}>moments</h1>
      <p className={styles.hint}>drag or flick — it never ends</p>
      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track} ref={trackRef}>
          {photos.map((src, i) => (
            <div className={styles.slide} key={`${src}-${i}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                aria-hidden="true"
                className={styles.photo}
                draggable={false}
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
