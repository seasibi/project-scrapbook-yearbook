"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { GalleryPhoto } from "@/types";

/**
 * Cinematic long-scroll gallery: full-viewport scroll chapters laid out as
 * scattered scrapbook collages (tilted polaroids, film strips, washi tape,
 * doodles), mirroring the Canva gallery design. Reveal is driven by
 * IntersectionObserver (threshold 0.2) — no scroll listeners; each chapter
 * animates in once (data-animated="true").
 *
 * Photos are supplied by the caller as an already-sorted `GalleryPhoto[]`
 * slice (see YearbookShell — the gallery section is one continuous
 * oldest→recent timeline split across frame/carousel bands) and assigned to
 * each chapter's pieces positionally, in authored order. `chapterIds` lets a
 * single caller render just a subset of CHAPTERS (e.g. chapter 1 alone).
 */

type PieceKind = "polaroid" | "photo" | "note" | "filmstrip" | "tiktok";
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
    // 13 photo slots, reorganized to eliminate overlaps and maximize space.
    // Row 1 (top): 4 filmstrip frames · large photo. Row 2: 3 photos spaced.
    // Row 3: 2 photos. Row 4: 4 photos across the bottom.
    pieces: [
      { label: "img1",  kind: "filmstrip", x: 1,  y: 2,  w: 20, rot: 0,  frames: ["img1","img2","img3","img4"] },
      { label: "img5",  kind: "photo",     x: 27, y: 0,  w: 40, rot: 2 },
      { label: "img6",  kind: "polaroid",  x: 72, y: 5,  w: 24, rot: -2, tape: "plain" },
      { label: "img7",  kind: "polaroid",  x: 5,  y: 50, w: 20, rot: -4, tape: "plain" },
      { label: "img8",  kind: "photo",     x: 32, y: 38, w: 32, rot: -1 },
      { label: "img9",  kind: "polaroid",  x: 70, y: 38, w: 25, rot: 2 },
      { label: "img10", kind: "polaroid",  x: 1,  y: 75, w: 22, rot: -2 },
      { label: "img11", kind: "polaroid",  x: 27, y: 76, w: 22, rot: 3 },
      { label: "img12", kind: "polaroid",  x: 50, y: 75, w: 23, rot: -2, tape: "plain" },
      { label: "img13", kind: "polaroid",  x: 77, y: 76, w: 20, rot: 4 },
    ],
    doodles: [
      { label: "scrap1", x: 88, y: 35, w: 7, rot: 6 },
      { label: "scrap2", x: 15, y: 88, w: 8, rot: 3 },
      { label: "scrap3", x: 65, y: 89, w: 7, rot: -4 },
    ],
  },
  {
    id: "2",
    // 7 photo slots, reorganized. Row 1: 4 pieces spaced. Row 2: 3 pieces across.
    pieces: [
      { label: "img14", kind: "polaroid", x: 2,  y: 8,  w: 21, rot: -3, tape: "plain" },
      { label: "img15", kind: "photo",    x: 28, y: 10, w: 24, rot: 2,  clip: true },
      { label: "img16", kind: "polaroid", x: 57, y: 5,  w: 32, rot: -1 },
      { label: "img17", kind: "note",     x: 5,  y: 32, w: 28, rot: 3 },
      { label: "img18", kind: "polaroid", x: 38, y: 34, w: 24, rot: 2 },
      { label: "img19", kind: "photo",    x: 67, y: 32, w: 30, rot: -2 },
      { label: "img20", kind: "polaroid", x: 2,  y: 58, w: 25, rot: 3 },
    ],
    doodles: [
      { label: "scrap4", x: 32, y: 85, w: 9, rot: 4 },
      { label: "scrap5", x: 70, y: 82, w: 8, rot: -5 },
      { label: "scrap6", x: 8,  y: 26, w: 9, rot: 6 },
    ],
  },
  {
    id: "3",
    // 10 photo slots, reorganized. Row 1: 3 polaroids + filmstrip. Row 2: 4 photos.
    pieces: [
      { label: "img21", kind: "polaroid",  x: 2,  y: 2,  w: 21, rot: -4, tape: "heart" },
      { label: "img22", kind: "polaroid",  x: 28, y: 0,  w: 28, rot: 4,  tape: "plain" },
      { label: "img23", kind: "polaroid",  x: 61, y: 3,  w: 20, rot: -2 },
      { label: "img24", kind: "filmstrip", x: 1,  y: 42, w: 18, rot: 0,  frames: ["img24","img25","img26","img27"] },
      { label: "img28", kind: "photo",     x: 24, y: 43, w: 28, rot: 2 },
      { label: "img29", kind: "polaroid",  x: 55, y: 45, w: 20, rot: -3, tape: "plain" },
      { label: "img30", kind: "polaroid",  x: 77, y: 47, w: 21, rot: 2 },
    ],
    doodles: [
      { label: "scrap7", x: 48, y: 14, w: 9, rot: -4 },
      { label: "scrap8", x: 12, y: 76, w: 9, rot: 5 },
    ],
  },
];

/** how many photos a piece consumes from the sequential assignment pass */
function slotCount(piece: Piece): number {
  if (piece.kind === "tiktok") return 0;
  if (piece.kind === "filmstrip") return piece.frames?.length ?? 4;
  return 1;
}

type AssignedPiece = Piece & { srcs: string[] };
type AssignedChapter = Omit<Chapter, "pieces"> & { pieces: AssignedPiece[] };

/**
 * Walks chapters' pieces in authored order, consuming `photos` sequentially
 * and attaching each piece's resolved src(s). Positional, not label-based —
 * whichever chronological slice the caller passes fills the layout in order.
 */
function assignPhotos(
  chapters: Chapter[],
  photos: GalleryPhoto[]
): AssignedChapter[] {
  let idx = 0;
  return chapters.map((chapter) => ({
    ...chapter,
    pieces: chapter.pieces.map((piece) => {
      const count = slotCount(piece);
      const srcs = photos.slice(idx, idx + count).map((p) => p.src);
      idx += count;
      return { ...piece, srcs };
    }),
  }));
}

function filenameOf(src?: string): string | undefined {
  return src?.split("/").pop();
}

/* TEMPORARY: shows the resolved filename on every frame for debugging which
 * photo landed where. Set to false once you're happy with the assignment. */
const SHOW_LABELS = false;

/**
 * Renders a resolved photo src, falling back to PlaceholderArt while loading
 * or if the src is missing/fails to load.
 */
function GalleryPhoto({ src, label }: { src?: string; label?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <>
        <PlaceholderArt />
        {SHOW_LABELS && label && <span className="piece-label">{label}</span>}
      </>
    );
  }

  return (
    <>
      {SHOW_LABELS && label && <span className="piece-label">{label}</span>}
      {!loaded && <div className="piece-art-wrap"><PlaceholderArt /></div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="piece-real-photo"
        style={{ display: loaded ? "block" : "none" }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}

/** Drop vid1.mp4 (or .webm) into public/gallery/ to fill the TikTok frame. */
function GalleryVideo({ label }: { label: string }) {
  return (
    <video
      className="tt-video"
      autoPlay
      muted
      loop
      playsInline
      aria-label={label}
    >
      <source src={`/gallery/${label}.mp4`} type="video/mp4" />
      <source src={`/gallery/${label}.webm`} type="video/webm" />
    </video>
  );
}

/* ── TikTok frame: a fake-but-real TikTok UI over the video ────────────────────
 * Edit anything in TIKTOK below — username, caption, sound, counts. */
const TIKTOK = {
  username: "batch2026",
  caption: "last day energy 🥹 #music #dance #foryou #foryoupage",
  sound: "original sound — batch 2026",
  likes: "633.0K",
  comments: "10K",
  saves: "60.5K",
  shares: "11.9K",
};

function TikTokFrame({ label }: { label: string }) {
  const t = TIKTOK;
  return (
    <div className="tt-stage">
      <GalleryVideo label={label} />
      <span className="tt-shade" aria-hidden="true" />

      {/* top tabs */}
      <div className="tt-top">
        <span className="tt-tabs">
          <span className="tt-tab">Following</span>
          <span className="tt-tab tt-tab--active">For You</span>
        </span>
        <svg className="tt-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>

      {/* right action rail */}
      <div className="tt-rail">
        <span className="tt-avatar">
          <span className="tt-avatar-img" />
          <span className="tt-follow" aria-hidden="true">+</span>
        </span>
        <span className="tt-action">
          <svg className="tt-ic tt-ic--like" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7-4.35-9.5-8.5C.5 8.7 2 5 5.5 5 7.6 5 9 6.4 12 9c3-2.6 4.4-4 6.5-4C22 5 23.5 8.7 21.5 12.5 19 16.65 12 21 12 21z" />
          </svg>
          <span className="tt-count">{t.likes}</span>
        </span>
        <span className="tt-action">
          <svg className="tt-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.5 3 2 6.6 2 11c0 2.3 1.2 4.4 3.2 5.9-.2 1.3-.8 2.6-1.7 3.8 1.8-.3 3.4-1 4.8-2.1 1.1.3 2.4.4 3.7.4 5.5 0 10-3.6 10-8s-4.5-8-10-8z" />
          </svg>
          <span className="tt-count">{t.comments}</span>
        </span>
        <span className="tt-action">
          <svg className="tt-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
          <span className="tt-count">{t.saves}</span>
        </span>
        <span className="tt-action">
          <svg className="tt-ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M21 12 11 4v4C5 9 3 14 3 20c2.5-4 5-5 8-5v4l10-7z" />
          </svg>
          <span className="tt-count">{t.shares}</span>
        </span>
        <span className="tt-disc" aria-hidden="true">
          <svg className="tt-disc-note" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 17V5l9-2v11" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="7" cy="17" r="2.4" />
            <circle cx="16" cy="14" r="2.4" />
          </svg>
        </span>
      </div>

      {/* bottom caption */}
      <div className="tt-info">
        <span className="tt-user">@{t.username}</span>
        <span className="tt-caption">{t.caption}</span>
        <span className="tt-sound">
          <svg className="tt-note" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9 17V5l9-2v11" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="7" cy="17" r="2.2" />
            <circle cx="16" cy="14" r="2.2" />
          </svg>
          <span className="tt-sound-text">{t.sound}</span>
        </span>
      </div>

      {/* bottom nav */}
      <div className="tt-nav" aria-hidden="true">
        <svg className="tt-nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
        <svg className="tt-nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 5.5a3 3 0 0 1 0 6M18.5 14c1.6.7 2.5 2.2 2.5 4" />
        </svg>
        <span className="tt-create">+</span>
        <svg className="tt-nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M4 5h16v12H8l-4 4z" />
        </svg>
        <svg className="tt-nav-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </div>
    </div>
  );
}

/* the sky-cloud-hills placeholder art from the Canva mockup */
function PlaceholderArt() {
  return (
    <svg viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden="true" className="piece-art">
      <rect width="100" height="75" fill="var(--paper, #fdfaf2)" />
      <rect x="20" y="15" width="60" height="42" rx="2" fill="none" stroke="var(--card-border, #cfc4a8)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="50" cy="30" r="8" fill="none" stroke="var(--accent, #9a7a58)" strokeWidth="1.2" opacity="0.5" />
      <path d="M46 30l4 4 4-4" fill="none" stroke="var(--accent, #9a7a58)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      <text x="50" y="48" textAnchor="middle" fill="var(--ink-soft, #6e5a42)" fontSize="5" fontFamily="monospace" opacity="0.6">drop a photo here</text>
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

export default function GalleryScroll({
  photos,
  chapterIds,
}: {
  photos: GalleryPhoto[];
  chapterIds?: string[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useRef<Set<string>>(new Set());
  const [animated, setAnimated] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const chaptersToRender = chapterIds
    ? CHAPTERS.filter((c) => chapterIds.includes(c.id))
    : CHAPTERS;
  const assignedChapters = assignPhotos(chaptersToRender, photos);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const chapterEls = Array.from(
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
        // progress steps with the deepest rendered chapter currently in view
        const deepest = chaptersToRender.reduce(
          (max, chapter, i) => (inView.current.has(chapter.id) ? i + 1 : max),
          0
        );
        if (deepest > 0) setProgress(deepest / chaptersToRender.length);
      },
      { threshold: 0 }
    );

    chapterEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="gallery-scroll" ref={wrapRef}>
      <div className="gallery-chapters">
        {assignedChapters.map((chapter) => (
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
                          {piece.srcs.map((src, fi) => (
                            <div className="filmstrip-frame" key={`${piece.label}-${fi}`}>
                              <GalleryPhoto src={src} label={filenameOf(src)} />
                            </div>
                          ))}
                        </div>
                      ) : piece.kind === "tiktok" ? (
                        <div className="piece-tiktok-screen">
                          <TikTokFrame label={piece.label} />
                          {SHOW_LABELS && <span className="piece-label piece-label--tiktok">{piece.label}</span>}
                        </div>
                      ) : (
                        <div className="piece-photo-area">
                          <GalleryPhoto src={piece.srcs[0]} label={filenameOf(piece.srcs[0])} />
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
