"use client";

import { useEffect, useRef, useState } from "react";
import { ScrapLetter } from "@/components/RansomText";

const ROTS   = [-7, 5, -3, 6, -5, 2, 7, -4, 3, -6];
const DYS    = [0.05, -0.06, 0.02, -0.09, 0.06, -0.02, 0.08, 0, -0.04, 0.03];
const SCALES = [1, 1.07, 0.94, 1.04, 0.92, 1.09, 0.97, 1.02, 0.95, 1.05];

const STAGGER = 0.12;
const NUM_TIERS = 4;
const MAX_VARIANTS = 7;

let wordTierCursor = 0;

const lastFirstSrc = new Map<string, string>();

type UsedByChar = Map<string, Set<string>>;

function tierSrc(char: string, tier: number): string {
  return tier <= 1 ? `/letters/${char}.png` : `/letters/${char}-${tier}.png`;
}

function buildPool(char: string): string[] {
  const pool = [`/letters/${char}.png`];
  for (let n = 2; n <= MAX_VARIANTS; n++) pool.push(`/letters/${char}-${n}.png`);
  if (char === "t") pool.push(`/letters/t-1.png`);
  return pool;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function prioritise(arr: string[], src: string): string[] {
  const idx = arr.indexOf(src);
  if (idx <= 0) return arr;
  const out = [...arr];
  out.splice(idx, 1);
  out.unshift(src);
  return out;
}

function deprioritise(arr: string[], src: string): string[] {
  const idx = arr.indexOf(src);
  if (idx === -1 || arr.length <= 1) return arr;
  const out = [...arr];
  out.splice(idx, 1);
  out.push(src);
  return out;
}

function buildCandidates(char: string, tier: number, isFirst: boolean, usedByChar: UsedByChar): string[] {
  let pool = shuffle(buildPool(char));
  if (isFirst) {
    const prev = lastFirstSrc.get(char);
    if (prev) pool = deprioritise(pool, prev);
  }
  const used = usedByChar.get(char);
  if (used) for (const src of used) pool = deprioritise(pool, src);
  pool = prioritise(pool, tierSrc(char, tier));
  return pool;
}

// ── per-letter component — owns its own wrapper span ─────────────────────────

function LetterImage({
  char,
  tier,
  isFirst,
  usedByChar,
  k,
  intro,
  introDelay,
  idx,
}: {
  char: string;
  tier: number;
  isFirst: boolean;
  usedByChar: UsedByChar;
  k: number;
  intro: boolean;
  introDelay: number;
  idx: number;
}) {
  const [candidates, setCandidates] = useState<string[]>([`/letters/${char}.png`]);
  const [attempt, setAttempt] = useState(0);
  // loaded = image has fired onLoad (or we've fallen through to ScrapLetter)
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCandidates(buildCandidates(char, tier, isFirst, usedByChar));
    setAttempt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When all image attempts exhaust we fall back to ScrapLetter — mark loaded
  useEffect(() => {
    if (attempt >= candidates.length) setLoaded(true);
  }, [attempt, candidates.length]);

  const isAlt = idx % 2 === 1;
  const spanClass = intro
    ? `stop-letter${isAlt ? " stop-letter--alt" : ""}${loaded ? " loaded" : ""}`
    : "stop-letter-static";
  const spanStyle = intro
    ? { animationDelay: `${(introDelay + idx * STAGGER).toFixed(2)}s` }
    : undefined;

  const transform = `translateY(${DYS[k % DYS.length]}em) rotate(${ROTS[k % ROTS.length]}deg) scale(${SCALES[k % SCALES.length]})`;

  const content =
    attempt >= candidates.length ? (
      <ScrapLetter char={char} k={k} />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={candidates[attempt]}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="ransom-img"
        style={{ ["--lt" as string]: transform }}
        onLoad={() => {
          if (!usedByChar.has(char)) usedByChar.set(char, new Set());
          usedByChar.get(char)!.add(candidates[attempt]);
          if (isFirst) lastFirstSrc.set(char, candidates[attempt]);
          setLoaded(true);
        }}
        onError={() => setAttempt((a) => a + 1)}
      />
    );

  return (
    <span className={spanClass} style={spanStyle}>
      {content}
    </span>
  );
}

// ── main component ────────────────────────────────────────────────────────────

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
  const tierRef = useRef<number | null>(null);
  if (tierRef.current === null) {
    tierRef.current = (wordTierCursor++ % NUM_TIERS) + 1;
  }
  const tier = tierRef.current;

  const usedByChar: UsedByChar = new Map();
  const seenChars = new Set<string>();

  return (
    <span className={`ransom-img-word ${className}`} aria-label={text} role="text">
      {text.split("").map((raw, i) => {
        if (raw === " ") {
          return <span key={i} className="ransom-space" aria-hidden="true" />;
        }
        const char = raw.toLowerCase();
        if (!/^[a-z0-9]$/.test(char)) {
          // Non-alpha: CSS scrap letter, always considered "loaded"
          const spanClass = intro
            ? `stop-letter${i % 2 === 1 ? " stop-letter--alt" : ""} loaded`
            : "stop-letter-static";
          const spanStyle = intro
            ? { animationDelay: `${(introDelay + i * STAGGER).toFixed(2)}s` }
            : undefined;
          return (
            <span key={i} className={spanClass} style={spanStyle}>
              <ScrapLetter char={raw} k={i + seed} />
            </span>
          );
        }
        const isFirst = !seenChars.has(char);
        seenChars.add(char);
        return (
          <LetterImage
            key={`${char}-${i}`}
            char={char}
            tier={tier}
            isFirst={isFirst}
            usedByChar={usedByChar}
            k={i + seed}
            intro={intro}
            introDelay={introDelay}
            idx={i}
          />
        );
      })}
    </span>
  );
}
