"use client";

import { useEffect, useRef, useState } from "react";
import { ScrapLetter } from "@/components/RansomText";
import { LETTERS } from "@/lib/lettersManifest";

const ROTS   = [-7, 5, -3, 6, -5, 2, 7, -4, 3, -6];
const DYS    = [0.05, -0.06, 0.02, -0.09, 0.06, -0.02, 0.08, 0, -0.04, 0.03];
const SCALES = [1, 1.07, 0.94, 1.04, 0.92, 1.09, 0.97, 1.02, 0.95, 1.05];

const STAGGER = 0.12;        // seconds between letters in the left→right cascade
const NUM_TIERS = 4;         // words pick a "batch" so each looks cut from one export
const READY_TIMEOUT = 700;   // ms — play even if a glyph image is still loading

/**
 * Deterministic glyph choice — same (char, occurrence, tier) always resolves to
 * the same real file from the manifest, so the title looks identical on every
 * reload and never 404s. `tier` keeps a word's letters visually coherent;
 * `occurrence` makes a repeated letter in one word use a different cut-out.
 * Returns null when no artwork exists → caller uses the CSS ScrapLetter.
 */
function pickSrc(char: string, occurrence: number, tier: number): string | null {
  const variants = LETTERS[char];
  if (!variants || variants.length === 0) return null;
  const start = (tier - 1) % variants.length;
  return variants[(start + occurrence) % variants.length];
}

// ── per-letter image — falls back to a CSS scrap if the file is missing ──────

function LetterImage({
  char,
  src,
  k,
  onResolved,
}: {
  char: string;
  src: string;
  k: number;
  onResolved: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const transform = `translateY(${DYS[k % DYS.length]}em) rotate(${ROTS[k % ROTS.length]}deg) scale(${SCALES[k % SCALES.length]})`;

  if (failed) return <ScrapLetter char={char} k={k} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="ransom-img"
      style={{ ["--lt" as string]: transform }}
      onLoad={onResolved}
      onError={() => {
        // stale manifest safety net: count it so the word never hangs
        setFailed(true);
        onResolved();
      }}
    />
  );
}

// ── main component ──────────────────────────────────────────────────────────

type Item =
  | { kind: "space"; i: number }
  | { kind: "scrap"; i: number; raw: string }
  | { kind: "img"; i: number; raw: string; char: string; src: string };

export default function RansomImageText({
  text,
  seed = 0,
  className = "",
  intro = true,
  introDelay = 0,
}: {
  text: string;
  seed?: number;
  className?: string;
  intro?: boolean;
  introDelay?: number;
}) {
  // tier derived from the seed → deterministic, and adjacent words (different
  // seeds) tend to land on different batches. Change a title's seed to reroll.
  const tier = (seed % NUM_TIERS) + 1;

  // resolve every character once, at render time (pure — no randomness)
  const seen: Record<string, number> = {};
  const items: Item[] = text.split("").map((raw, i) => {
    if (raw === " ") return { kind: "space", i };
    const char = raw.toLowerCase();
    if (!/^[a-z0-9]$/.test(char)) return { kind: "scrap", i, raw };
    const occurrence = seen[char] ?? 0;
    seen[char] = occurrence + 1;
    const src = pickSrc(char, occurrence, tier);
    return src ? { kind: "img", i, raw, char, src } : { kind: "scrap", i, raw };
  });

  const imgCount = items.reduce((n, it) => (it.kind === "img" ? n + 1 : n), 0);

  // word-level gate: the whole cascade waits until every glyph image has
  // resolved (or the timeout), so each letter's stagger clock starts together
  // and the left→right order is guaranteed regardless of load timing.
  const [ready, setReady] = useState(!intro);
  const loadedRef = useRef(0);

  useEffect(() => {
    if (!intro) return;
    loadedRef.current = 0;
    if (imgCount === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    const t = setTimeout(() => setReady(true), READY_TIMEOUT);
    return () => clearTimeout(t);
  }, [intro, imgCount, text]);

  const handleResolved = () => {
    loadedRef.current += 1;
    if (loadedRef.current >= imgCount) setReady(true);
  };

  const wordClass = [
    "ransom-img-word",
    className,
    intro && ready ? "ready" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wordClass} aria-label={text} role="text">
      {items.map((it) => {
        if (it.kind === "space") {
          return <span key={it.i} className="ransom-space" aria-hidden="true" />;
        }
        const spanClass = intro
          ? `stop-letter${it.i % 2 === 1 ? " stop-letter--alt" : ""}`
          : "stop-letter-static";
        const spanStyle = intro
          ? { animationDelay: `${(introDelay + it.i * STAGGER).toFixed(2)}s` }
          : undefined;

        return (
          <span key={it.i} className={spanClass} style={spanStyle}>
            {it.kind === "img" ? (
              <LetterImage
                char={it.char}
                src={it.src}
                k={it.i + seed}
                onResolved={handleResolved}
              />
            ) : (
              <ScrapLetter char={it.raw} k={it.i + seed} />
            )}
          </span>
        );
      })}
    </span>
  );
}
