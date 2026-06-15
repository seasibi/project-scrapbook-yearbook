"use client";

import { useState, type ReactNode } from "react";
import { ScrapLetter } from "@/components/RansomText";

/**
 * Ransom-note lettering built from the actual Canva cut-out letter images.
 * Each letter tries the user-cropped PNGs in /public/letters/ and falls back
 * to the CSS paper-scrap style (ScrapLetter) for any file that doesn't exist
 * yet — so words render correctly today and upgrade letter-by-letter as
 * images are dropped in.
 *
 * File convention (see public/letters/README.txt):
 *   /letters/<char>.png            — e.g. a.png, r.png
 *   /letters/<char>-<n>.png        — optional variant art for the nth
 *                                    occurrence of a letter in the word
 *
 * With `intro` (default), letters slap down one by one in discrete stepped
 * poses — a stop-motion entrance (CSS `stopMotionIn*` keyframes, step-end).
 */

// deterministic per-letter scatter, like the Canva collage
const ROTS = [-7, 5, -3, 6, -5, 2, 7, -4, 3, -6];
const DYS = [0.05, -0.06, 0.02, -0.09, 0.06, -0.02, 0.08, 0, -0.04, 0.03];
const SCALES = [1, 1.07, 0.94, 1.04, 0.92, 1.09, 0.97, 1.02, 0.95, 1.05];

const STAGGER = 0.12; // seconds between letters landing

function LetterImage({
  char,
  occurrence,
  k,
}: {
  char: string;
  occurrence: number;
  k: number;
}) {
  // try the occurrence variant first (h-2.png), then the base letter (h.png),
  // then give up and render the CSS scrap
  const candidates =
    occurrence > 1
      ? [`/letters/${char}-${occurrence}.png`, `/letters/${char}.png`]
      : [`/letters/${char}.png`];
  const [attempt, setAttempt] = useState(0);

  if (attempt >= candidates.length) {
    return <ScrapLetter char={char} k={k} />;
  }

  const transform = `translateY(${DYS[k % DYS.length]}em) rotate(${
    ROTS[k % ROTS.length]
  }deg) scale(${SCALES[k % SCALES.length]})`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[attempt]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="ransom-img"
      style={{ ["--lt" as string]: transform }}
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}

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
  /** stop-motion entrance, letters landing one by one */
  intro?: boolean;
  /** seconds before the first letter of this word lands */
  introDelay?: number;
}) {
  // count occurrences so repeated letters can use variant artwork
  const seen = new Map<string, number>();

  const wrap = (i: number, letter: ReactNode) =>
    intro ? (
      <span
        key={i}
        className={`stop-letter ${i % 2 === 0 ? "" : "stop-letter--alt"}`}
        style={{ animationDelay: `${(introDelay + i * STAGGER).toFixed(2)}s` }}
      >
        {letter}
      </span>
    ) : (
      <span key={i} className="stop-letter-static">
        {letter}
      </span>
    );

  return (
    <span className={`ransom-img-word ${className}`} aria-label={text} role="text">
      {text.split("").map((raw, i) => {
        if (raw === " ") {
          return <span key={i} className="ransom-space" aria-hidden="true" />;
        }
        const char = raw.toLowerCase();
        if (!/^[a-z0-9]$/.test(char)) {
          return wrap(i, <ScrapLetter char={raw} k={i + seed} />);
        }
        const occurrence = (seen.get(char) ?? 0) + 1;
        seen.set(char, occurrence);
        return wrap(
          i,
          <LetterImage char={char} occurrence={occurrence} k={i + seed} />
        );
      })}
    </span>
  );
}
