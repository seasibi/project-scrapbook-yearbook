"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Cinematic long-scroll gallery: three full-viewport scroll chapters laid
 * out as scattered scrapbook collages (tilted polaroids, film strips, washi
 * tape, doodles), mirroring the three bands of the Canva gallery design.
 * Reveal is driven by IntersectionObserver (threshold 0.2) — no scroll
 * listeners; each chapter animates in once (data-animated="true").
 *
 * Adding a 4th/5th chapter = adding one entry to CHAPTERS, nothing else.
 * Each placeholder is labelled (img1…img17) so real photos can be swapped
 * in later by matching the label.
 */

type PieceKind = "polaroid" | "photo" | "note" | "filmstrip";
type TapeKind = "plain" | "heart" | "gingham";
type DoodleArt = "notes" | "bow" | "butterfly" | "star" | "flower" | "news" | "washi";

interface Piece {
  label: string;
  kind: PieceKind;
  /** position + size as % of the chapter canvas, rotation in degrees */
  x: number;
  y: number;
  w: number;
  rot: number;
  /** extra frame labels for filmstrips */
  frames?: string[];
  tape?: TapeKind;
  clip?: boolean;
}

interface Doodle {
  art: DoodleArt;
  x: number;
  y: number;
  w: number;
  rot?: number;
}

interface Chapter {
  id: string;
  number: string;
  label: string;
  pieces: Piece[];
  doodles: Doodle[];
}

const CHAPTERS: Chapter[] = [
  {
    id: "1",
    number: "01",
    label: "Gallery — Chapter 1",
    pieces: [
      { label: "img1", kind: "filmstrip", x: 1, y: 2, w: 14, rot: 0, frames: ["img1", "img2", "img3", "img4"] },
      { label: "img5", kind: "polaroid", x: 19, y: 14, w: 24, rot: -4, tape: "plain" },
      { label: "img6", kind: "polaroid", x: 45, y: 6, w: 33, rot: 3 },
      { label: "img7", kind: "polaroid", x: 78, y: 1, w: 21, rot: -2, tape: "plain" },
    ],
    doodles: [
      { art: "news", x: 86, y: 26, w: 13, rot: 6 },
      { art: "notes", x: 47, y: 0, w: 22, rot: -2 },
      { art: "bow", x: 73, y: 22, w: 6, rot: 8 },
      { art: "washi", x: -2, y: 78, w: 104, rot: -1.2 },
    ],
  },
  {
    id: "2",
    number: "02",
    label: "Gallery — Chapter 2",
    pieces: [
      { label: "img8", kind: "polaroid", x: 2, y: 4, w: 20, rot: -3, tape: "plain" },
      { label: "img9", kind: "photo", x: 17, y: 36, w: 24, rot: 2, clip: true },
      { label: "img10", kind: "polaroid", x: 44, y: 14, w: 30, rot: 0 },
      { label: "img11", kind: "note", x: 76, y: 10, w: 22, rot: 3 },
    ],
    doodles: [
      { art: "notes", x: 36, y: 8, w: 12, rot: -8 },
      { art: "butterfly", x: 1, y: 66, w: 9, rot: -6 },
      { art: "bow", x: 35, y: 62, w: 8, rot: -10 },
      { art: "washi", x: -2, y: 92, w: 104, rot: 0.8 },
    ],
  },
  {
    id: "3",
    number: "03",
    label: "Gallery — Chapter 3",
    pieces: [
      { label: "img12", kind: "polaroid", x: 15, y: 16, w: 21, rot: -5, tape: "heart" },
      { label: "img13", kind: "polaroid", x: 42, y: 6, w: 31, rot: 6, tape: "plain" },
      { label: "img14", kind: "filmstrip", x: 85, y: 0, w: 14, rot: 0, frames: ["img14", "img15", "img16", "img17"] },
    ],
    doodles: [
      { art: "star", x: 76, y: 0, w: 9, rot: -8 },
      { art: "flower", x: 10, y: 66, w: 11, rot: 4 },
      { art: "washi", x: -2, y: 2, w: 70, rot: -0.6 },
    ],
  },
];

/* the sky-cloud-hills placeholder art from the Canva mockup */
function PlaceholderArt() {
  return (
    <svg viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true" className="piece-art">
      <rect width="100" height="75" fill="#d7ebf7" />
      <rect width="100" height="40" fill="#cfe4f4" />
      <g fill="#ffffff">
        <ellipse cx="62" cy="17" rx="13" ry="6.5" />
        <ellipse cx="53" cy="20" rx="9" ry="5" />
        <ellipse cx="71" cy="20" rx="9" ry="5" />
      </g>
      <path d="M0 52C20 42 40 46 56 52s30 8 44-2v25H0z" fill="#a8cc62" />
      <path d="M0 61c28-8 58-4 100 2v12H0z" fill="#8fb84a" />
    </svg>
  );
}

const DOODLES: Record<DoodleArt, ReactNode> = {
  notes: (
    <svg viewBox="0 0 120 32" aria-hidden="true">
      <g fill="currentColor">
        <circle cx="8" cy="24" r="4" /><rect x="11" y="4" width="2.4" height="21" />
        <path d="M13 4l9 3v5l-9-3z" />
        <circle cx="38" cy="26" r="3.4" /><rect x="40.6" y="8" width="2.2" height="19" />
        <circle cx="60" cy="22" r="4" /><rect x="63" y="2" width="2.4" height="21" />
        <circle cx="78" cy="22" r="4" /><rect x="81" y="2" width="2.4" height="21" />
        <rect x="63" y="2" width="20.4" height="4" />
        <circle cx="106" cy="25" r="3.4" /><rect x="108.6" y="7" width="2.2" height="19" />
        <path d="M110.8 7l8 2.6v4.4l-8-2.6z" />
      </g>
    </svg>
  ),
  bow: (
    <svg viewBox="0 0 48 40" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M24 20C16 10 8 8 5 12c-3 4 1 11 13 11 2 0 4-1 6-3z" />
        <path d="M24 20c8-10 16-12 19-8 3 4-1 11-13 11-2 0-4-1-6-3z" />
        <path d="M21 23l-4 12 7-4 7 4-4-12" />
        <circle cx="24" cy="21" r="3.6" fill="currentColor" stroke="none" />
      </g>
    </svg>
  ),
  butterfly: (
    <svg viewBox="0 0 48 44" aria-hidden="true">
      <g fill="currentColor">
        <path d="M23 22C13 8 3 8 4 16c1 8 11 12 19 10zm2 0c10-14 20-14 19-6-1 8-11 12-19 10z" />
        <path d="M22 24c-8 0-14 4-12 10 2 5 9 3 12-6zm4 0c8 0 14 4 12 10-2 5-9 3-12-6z" />
        <rect x="22.8" y="12" width="2.4" height="22" rx="1.2" />
      </g>
    </svg>
  ),
  star: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 5l5 13 14 1.4-10.6 8.8 3.6 13.8L24 34.4 12 42l3.6-13.8L5 19.4 19 18z"
        fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"
      />
    </svg>
  ),
  flower: (
    <svg viewBox="0 0 48 56" aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="24" cy="10" rx="7" ry="9" />
        <ellipse cx="11" cy="20" rx="9" ry="7" transform="rotate(-30 11 20)" />
        <ellipse cx="37" cy="20" rx="9" ry="7" transform="rotate(30 37 20)" />
        <ellipse cx="16" cy="32" rx="7" ry="9" transform="rotate(28 16 32)" />
        <ellipse cx="32" cy="32" rx="7" ry="9" transform="rotate(-28 32 32)" />
        <rect x="22.6" y="36" width="2.8" height="18" rx="1.4" />
      </g>
      <circle cx="24" cy="23" r="5.5" fill="var(--paper)" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 60 80" aria-hidden="true">
      <path d="M2 4l54-4 2 72-52 6z" fill="var(--paper)" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <text x="8" y="16" fontFamily="var(--font-serif)" fontStyle="italic" fontSize="11" fill="currentColor">Times.</text>
      <g stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.6">
        <path d="M8 26h42M8 32h42M8 38h36M8 44h42M8 50h40M8 56h42M8 62h32" />
      </g>
    </svg>
  ),
  washi: <span className="washi-bar" />,
};

export default function GalleryScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useRef<Set<string>>(new Set());
  const [animated, setAnimated] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const chapters = Array.from(
      root.querySelectorAll<HTMLElement>("[data-gallery-section]")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.gallerySection;
          if (!id) continue;
          if (entry.isIntersecting) {
            inView.current.add(id);
            // animate in once, never re-trigger
            setAnimated((prev) =>
              prev.has(id) ? prev : new Set(prev).add(id)
            );
          } else {
            inView.current.delete(id);
          }
        }
        // progress steps with the deepest chapter currently in view:
        // chapter 1 → 1/3, chapter 2 → 2/3, chapter 3 → 3/3
        const deepest = CHAPTERS.reduce(
          (max, chapter, i) => (inView.current.has(chapter.id) ? i + 1 : max),
          0
        );
        if (deepest > 0) setProgress(deepest / CHAPTERS.length);
      },
      { threshold: 0.2 }
    );

    chapters.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="gallery-scroll" ref={wrapRef}>
      <div className="gallery-chapters">
        {CHAPTERS.map((chapter, i) => (
          <Fragment key={chapter.id}>
            {i > 0 && (
              <div className="gallery-divider" aria-hidden="true">
                <span className="gallery-divider-mark">✦</span>
              </div>
            )}
            <section
              className="gallery-chapter"
              data-gallery-section={chapter.id}
              data-animated={animated.has(chapter.id) ? "true" : undefined}
            >
              <span className="chapter-watermark" aria-hidden="true">
                {chapter.number}
              </span>
              <h3 className="chapter-title">{chapter.label}</h3>

              <div className="chapter-canvas">
                {chapter.pieces.map((piece, p) => (
                  <div
                    key={piece.label}
                    className={`chapter-piece piece-${piece.kind}`}
                    style={{
                      ["--x" as string]: `${piece.x}%`,
                      ["--y" as string]: `${piece.y}%`,
                      ["--pw" as string]: `${piece.w}%`,
                      ["--rot" as string]: `${piece.rot}deg`,
                      ["--d" as string]: `${p * 80}ms`,
                    }}
                  >
                    {piece.tape && (
                      <span
                        className={`piece-tape piece-tape--${piece.tape}`}
                        aria-hidden="true"
                      />
                    )}
                    {piece.clip && (
                      <svg className="piece-clip" viewBox="0 0 14 44" aria-hidden="true">
                        <path
                          d="M7 3c2.8 0 5 2.2 5 5v26a4 4 0 0 1-8 0V12a2.5 2.5 0 0 1 5 0v20"
                          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        />
                      </svg>
                    )}
                    <div className="piece-pad">
                      {piece.kind === "filmstrip" ? (
                        <div className="filmstrip-frames">
                          {(piece.frames ?? [piece.label]).map((frame) => (
                            <div className="filmstrip-frame" key={frame}>
                              <PlaceholderArt />
                              <span className="piece-label pixel-font">{frame}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="piece-photo-area">
                          <PlaceholderArt />
                          <span className="piece-label pixel-font">{piece.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chapter.doodles.map((doodle, d) => (
                  <span
                    key={`${doodle.art}-${d}`}
                    className={`chapter-doodle doodle-${doodle.art}`}
                    aria-hidden="true"
                    style={{
                      ["--x" as string]: `${doodle.x}%`,
                      ["--y" as string]: `${doodle.y}%`,
                      ["--pw" as string]: `${doodle.w}%`,
                      ["--rot" as string]: `${doodle.rot ?? 0}deg`,
                      ["--d" as string]: `${(chapter.pieces.length + d) * 80}ms`,
                    }}
                  >
                    {DOODLES[doodle.art]}
                  </span>
                ))}
              </div>
            </section>
          </Fragment>
        ))}
      </div>

      <div className="gallery-progress" aria-hidden="true">
        <div
          className="gallery-progress-fill"
          style={{ height: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
