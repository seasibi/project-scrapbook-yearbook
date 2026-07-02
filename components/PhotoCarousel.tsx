"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import styles from "@/app/carousel/carousel.module.css";
import type { GalleryPhoto } from "@/types";

type Variant = "filmstrip" | "polaroid";

/**
 * Chronological photo carousel with two skins — a dark film reel and a washi
 * polaroid timeline. Shares one physics engine with DragCarousel: a single
 * `pos` drifts leftward when idle (autoplay) and is driven by a GSAP Draggable
 * + InertiaPlugin while grabbed. Slides are positioned individually and wrapped
 * by the strip's total width for a seamless infinite loop.
 *
 * Each slide's width is derived from its image aspect ratio (inside the frame
 * chrome), so landscape shots show in full. Photos arrive already sorted
 * oldest → recent; each frame prints its capture date in the style's voice.
 */
export default function PhotoCarousel({
  photos,
  variant,
  title,
  hint,
}: {
  photos: GalleryPhoto[];
  variant: Variant;
  title?: string;
  hint?: string;
}) {
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

    const AUTOPLAY_PX_PER_SEC = 42;

    const preventImgDrag = (e: Event) => e.preventDefault();
    track.addEventListener("dragstart", preventImgDrag);

    const proxy = document.createElement("div");
    let render: (pos: number) => void = () => {};
    const state = { pos: 0 };

    function build() {
      const slides = Array.from(
        track!.querySelectorAll<HTMLElement>(`.${styles.pcSlide}`)
      );
      const count = slides.length;
      if (count < 2) return;

      // read the frame chrome insets (declared per variant on the stage) so the
      // photo window's aspect matches the image and object-fit: cover never crops
      const cs = getComputedStyle(slides[0]);
      const px = (v: string) => parseFloat(cs.getPropertyValue(v)) || 0;
      const padX = px("--pc-padx");
      const padTop = px("--pc-padtop");
      const padBottom = px("--pc-padbottom");
      const gap = px("--pc-gap");

      const slideH = slides[0].getBoundingClientRect().height;
      const photoH = Math.max(1, slideH - padTop - padBottom);

      const widths: number[] = slides.map((s) => {
        const img = s.querySelector("img");
        let aspect = 3 / 4;
        if (img && img.naturalWidth && img.naturalHeight) {
          aspect = img.naturalWidth / img.naturalHeight;
        }
        aspect = gsap.utils.clamp(0.5, 2.2, aspect);
        const w = photoH * aspect + padX * 2;
        s.style.width = `${w}px`;
        return w;
      });

      const offsets: number[] = [];
      let acc = 0;
      for (let i = 0; i < count; i++) {
        offsets.push(acc);
        acc += widths[i] + gap;
      }
      const total = acc;
      const maxW = Math.max(...widths);
      const wrapItem = gsap.utils.wrap(-(maxW + gap), total - (maxW + gap));

      render = (pos: number) => {
        for (let i = 0; i < count; i++) {
          gsap.set(slides[i], { x: wrapItem(offsets[i] + pos) });
        }
      };

      render(state.pos);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => render(state.pos))
      );
    }

    build();

    const drag = Draggable.create(proxy, {
      type: "x",
      trigger: viewport,
      allowNativeTouchScrolling: false,
      dragClickables: true,
      inertia: !prefersReduced,
      onPressInit() {
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
        if (Number.isFinite(this.x)) state.pos = this.x;
      },
    })[0];

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
  }, [photos, variant]);

  const stageClass = `${styles.pcStage} ${
    variant === "filmstrip" ? styles.pcFilmstrip : styles.pcPolaroid
  }`;

  return (
    <div className={stageClass}>
      {title && <h3 className={styles.pcTitle}>{title}</h3>}
      {hint && <p className={styles.pcHint}>{hint}</p>}
      <div className={styles.pcViewport} ref={viewportRef}>
        <div className={styles.pcTrack} ref={trackRef}>
          {photos.map((p, i) => (
            <div className={styles.pcSlide} key={`${p.src}-${i}`}>
              <div
                className={styles.pcCard}
                style={
                  variant === "polaroid"
                    ? { transform: `rotate(${tiltFor(i)}deg)` }
                    : undefined
                }
              >
                {variant === "polaroid" && (
                  <span className={styles.pcWashi} aria-hidden="true" />
                )}
                <div className={styles.pcWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt=""
                    aria-hidden="true"
                    className={styles.pcPhoto}
                    draggable={false}
                    decoding="async"
                  />
                </div>
                <span className={styles.pcDate}>
                  {variant === "filmstrip"
                    ? formatReel(p.time, p.dated)
                    : formatScript(p.time, p.dated)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** deterministic gentle tilt per index for the polaroid skin */
function tiltFor(i: number): number {
  const seq = [-3, 2.4, -1.6, 3, -2.2, 1.8];
  return seq[i % seq.length];
}

/** "Mar ’24" for the filmstrip border — "~" prefix when the date is a file-mtime guess */
function formatReel(time: number, dated: boolean): string {
  const d = new Date(time);
  const mon = d.toLocaleString("en-US", { month: "short" });
  const yy = String(d.getFullYear()).slice(2);
  return `${dated ? "" : "~"}${mon} ’${yy}`;
}

/** "3.16.24" handwritten on the polaroid lip — "~" prefix when approximate */
function formatScript(time: number, dated: boolean): string {
  const d = new Date(time);
  const yy = String(d.getFullYear()).slice(2);
  return `${dated ? "" : "~"}${d.getMonth() + 1}.${d.getDate()}.${yy}`;
}
