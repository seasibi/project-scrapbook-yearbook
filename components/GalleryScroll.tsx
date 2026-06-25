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
    // Labels run sequentially across the whole gallery (chapter 1: 1–13 + vid1).
    // filmstrip img1–4 · img5 (large) · img6 · img7 · img8 · vid1 · img9 · img10
    // bottom row: img11 · img12 · img13
    pieces: [
      { label: "img1",  kind: "filmstrip", x: 0,  y: 0,  w: 22, rot: 0,  frames: ["img1","img2","img3","img4"] },
      { label: "img5",  kind: "photo",     x: 32, y: 0,  w: 42, rot: 2 },
      { label: "img6",  kind: "polaroid",  x: 72, y: 3,  w: 26, rot: -2, tape: "plain" },
      { label: "img7",  kind: "polaroid",  x: 24, y: 30, w: 21, rot: -4, tape: "plain" },
      { label: "img8",  kind: "photo",     x: 0,  y: 44, w: 34, rot: -1 },
      { label: "vid1",  kind: "tiktok",    x: 43, y: 35, w: 25, rot: 2 },
      { label: "img9",  kind: "polaroid",  x: 72, y: 26, w: 26, rot: 2 },
      { label: "img10", kind: "polaroid",  x: 72, y: 48, w: 26, rot: -2 },
      { label: "img11", kind: "polaroid",  x: 2,  y: 76, w: 26, rot: 3 },
      { label: "img12", kind: "polaroid",  x: 37, y: 77, w: 27, rot: -2, tape: "plain" },
      { label: "img13", kind: "polaroid",  x: 71, y: 76, w: 25, rot: 4 },
    ],
    doodles: [
      { label: "scrap1", x: 91, y: 25, w: 7, rot: 6 },
      { label: "scrap2", x: 28, y: 88, w: 8, rot: 3 },
      { label: "scrap3", x: 62, y: 87, w: 7, rot: -4 },
    ],
  },
  {
    id: "2",
    // chapter 2: img14–20.  Row 1: img14 · img15 · img16 · img17 (note)
    // Row 2 (bottom ~46%): img18 · img19 · img20
    pieces: [
      { label: "img14", kind: "polaroid", x: 2,  y: 11, w: 23, rot: -3, tape: "plain" },
      { label: "img15", kind: "photo",    x: 29, y: 13, w: 25, rot: 2,  clip: true },
      { label: "img16", kind: "polaroid", x: 53, y: 6,  w: 35, rot: -1 },
      { label: "img17", kind: "note",     x: 57, y: 41, w: 32, rot: 3 },
      { label: "img18", kind: "polaroid", x: 1,  y: 46, w: 27, rot: 2 },
      { label: "img19", kind: "photo",    x: 28, y: 46, w: 30, rot: -2 },
      { label: "img20", kind: "polaroid", x: 70, y: 64, w: 27, rot: 3 },
    ],
    doodles: [
      { label: "scrap4", x: 4,  y: 84, w: 9, rot: 4 },
      { label: "scrap5", x: 42, y: 85, w: 8, rot: -5 },
      { label: "scrap6", x: 74, y: 83, w: 9, rot: 6 },
    ],
  },
  {
    id: "3",
    // chapter 3: img21–30.  Row 1: img21 · img22 · img23 · filmstrip img24–27
    // Row 2 (bottom ~46%): img28 · img29 · img30
    pieces: [
      { label: "img21", kind: "polaroid",  x: 1,  y: 3,  w: 23, rot: -4, tape: "heart" },
      { label: "img22", kind: "polaroid",  x: 27, y: 0,  w: 31, rot: 4,  tape: "plain" },
      { label: "img23", kind: "polaroid",  x: 60, y: 3,  w: 23, rot: -2 },
      { label: "img24", kind: "filmstrip", x: 83, y: 0,  w: 16, rot: 0,  frames: ["img24","img25","img26","img27"] },
      { label: "img28", kind: "photo",     x: 1,  y: 46, w: 30, rot: 2 },
      { label: "img29", kind: "polaroid",  x: 34, y: 48, w: 27, rot: -3, tape: "plain" },
      { label: "img30", kind: "polaroid",  x: 66, y: 46, w: 29, rot: 2 },
    ],
    doodles: [
      { label: "scrap7", x: 22, y: 84, w: 9, rot: -4 },
      { label: "scrap8", x: 55, y: 85, w: 9, rot: 5 },
    ],
  },
];

const GALLERY_EXTS = ["jpg", "jpeg", "png", "webp", "avif"];

/* TEMPORARY: shows the filename badge on every frame so you know which photo
 * goes where (drop e.g. img5.jpg into public/gallery/). Set to false — or
 * delete the SHOW_LABELS references — once all images are placed. */
const SHOW_LABELS = false;

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
    return (
      <>
        <PlaceholderArt />
        {SHOW_LABELS && <span className="piece-label">{label}</span>}
      </>
    );
  }

  return (
    <>
      {SHOW_LABELS && <span className="piece-label">{label}</span>}
      {!loaded && <div className="piece-art-wrap"><PlaceholderArt /></div>}
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
                      ) : piece.kind === "tiktok" ? (
                        <div className="piece-tiktok-screen">
                          <TikTokFrame label={piece.label} />
                          {SHOW_LABELS && <span className="piece-label piece-label--tiktok">{piece.label}</span>}
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
