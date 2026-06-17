"use client";

import { Fragment, useEffect, useRef, useState } from "react";

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

interface Piece {
  label: string;
  kind: PieceKind;
  x: number;
  y: number;
  w: number;
  rot: number;
  frames?: string[];
  tape?: TapeKind;
  clip?: boolean;
}

interface Doodle {
  /** filename without extension — drop scrap1.png etc. into public/scrapbook/ */
  label: string;
  x: number;
  y: number;
  w: number;
  rot?: number;
}

interface Chapter {
  id: string;
  pieces: Piece[];
  doodles: Doodle[];
}

const CHAPTERS: Chapter[] = [
  {
    id: "1",
    pieces: [
      { label: "img1", kind: "filmstrip", x: 1, y: 2, w: 14, rot: 0, frames: ["img1", "img2", "img3", "img4"] },
      { label: "img5", kind: "polaroid", x: 19, y: 14, w: 24, rot: -4, tape: "plain" },
      { label: "img6", kind: "photo", x: 32, y: 2, w: 62, rot: 3 },
      { label: "img7", kind: "polaroid", x: 60, y: 42, w: 21, rot: -2, tape: "plain" },
    ],
    doodles: [
      { label: "scrap1", x: 86, y: 26, w: 13, rot: 6 },
      { label: "scrap2", x: 47, y: 0, w: 22, rot: -2 },
      { label: "scrap3", x: 73, y: 22, w: 6, rot: 8 },
    ],
  },
  {
    id: "2",
    pieces: [
      { label: "img8", kind: "polaroid", x: 2, y: 4, w: 20, rot: -3, tape: "plain" },
      { label: "img9", kind: "photo", x: 17, y: 36, w: 24, rot: 2, clip: true },
      { label: "img10", kind: "polaroid", x: 44, y: 14, w: 30, rot: 0 },
      { label: "img11", kind: "note", x: 76, y: 10, w: 22, rot: 3 },
    ],
    doodles: [
      { label: "scrap4", x: 36, y: 8, w: 12, rot: -8 },
      { label: "scrap5", x: 1, y: 66, w: 9, rot: -6 },
      { label: "scrap6", x: 35, y: 62, w: 8, rot: -10 },
    ],
  },
  {
    id: "3",
    pieces: [
      { label: "img12", kind: "polaroid", x: 15, y: 16, w: 21, rot: -5, tape: "heart" },
      { label: "img13", kind: "polaroid", x: 42, y: 6, w: 31, rot: 6, tape: "plain" },
      { label: "img14", kind: "filmstrip", x: 85, y: 0, w: 14, rot: 0, frames: ["img14", "img15", "img16", "img17"] },
    ],
    doodles: [
      { label: "scrap7", x: 76, y: 0, w: 9, rot: -8 },
      { label: "scrap8", x: 10, y: 66, w: 11, rot: 4 },
    ],
  },
];

const GALLERY_EXTS = ["jpg", "jpeg", "png", "webp", "avif"];

/**
 * Tries /gallery/<label>.<ext> in order; shows PlaceholderArt until an
 * image loads. Drop photos into public/gallery/ named to match the label
 * (e.g. img1.jpg, img2.png). If no file is found the placeholder stays.
 */
function GalleryPhoto({ label }: { label: string }) {
  const [src, setSrc] = useState(`/gallery/${label}.${GALLERY_EXTS[0]}`);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (attempt >= GALLERY_EXTS.length) {
    return <PlaceholderArt />;
  }

  return (
    <>
      {!loaded && <PlaceholderArt />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label}
        className="piece-real-photo"
        style={{ display: loaded ? "block" : "none" }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          const next = attempt + 1;
          if (next < GALLERY_EXTS.length) {
            setSrc(`/gallery/${label}.${GALLERY_EXTS[next]}`);
          }
          setAttempt(next);
        }}
      />
    </>
  );
}

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

const SCRAP_EXTS = ["png", "jpg", "jpeg", "webp", "avif"];

/**
 * Loads a scrapbook decoration image from public/scrapbook/<label>.<ext>.
 * Renders nothing if no matching file is found — slots stay invisible until
 * you drop an image in.
 */
function ScrapItem({ label }: { label: string }) {
  const [attempt, setAttempt] = useState(0);
  const [src, setSrc] = useState(`/scrapbook/${label}.${SCRAP_EXTS[0]}`);

  if (attempt >= SCRAP_EXTS.length) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="scrap-item-img"
      onError={() => {
        const next = attempt + 1;
        if (next < SCRAP_EXTS.length) setSrc(`/scrapbook/${label}.${SCRAP_EXTS[next]}`);
        setAttempt(next);
      }}
    />
  );
}

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
      { threshold: 0 }
    );

    chapters.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);


  return (
    <div className="gallery-scroll" ref={wrapRef}>
      <div className="gallery-chapters">
        {CHAPTERS.map((chapter) => (
          <Fragment key={chapter.id}>
            <section
              className="gallery-chapter"
              data-gallery-section={chapter.id}
              data-animated={animated.has(chapter.id) ? "true" : undefined}
            >
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
                              <GalleryPhoto label={frame} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="piece-photo-area">
                          <GalleryPhoto label={piece.label} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chapter.doodles.map((doodle, d) => (
                  <span
                    key={`${doodle.label}-${d}`}
                    className="chapter-doodle"
                    aria-hidden="true"
                    style={{
                      ["--x" as string]: `${doodle.x}%`,
                      ["--y" as string]: `${doodle.y}%`,
                      ["--pw" as string]: `${doodle.w}%`,
                      ["--rot" as string]: `${doodle.rot ?? 0}deg`,
                      ["--d" as string]: `${(chapter.pieces.length + d) * 80}ms`,
                    }}
                  >
                    <ScrapItem label={doodle.label} />
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
