/**
 * Ransom-note cut-out lettering, matching the Canva "home" design: each
 * letter sits on its own torn-paper scrap with a deterministic color,
 * rotation, and font picked from the letter's position.
 */

const SCRAP_COLORS = [
  "#c96f86", // pink
  "#7a2230", // maroon
  "#2f6f6a", // teal
  "#c97f2e", // orange
  "#2b3a67", // navy
  "#5a7d3a", // green
  "#c9a13b", // mustard
  "#f3e8d4", // paper
  "#8a5ac9", // violet
];

const LIGHT_SCRAPS = new Set(["#f3e8d4", "#c9a13b"]);

const ROTATIONS = [-7, 4, -3, 6, -5, 2, 7, -4, 3, -6, 5, -2];
const FONTS = [
  "var(--font-serif)",
  "var(--font-pixel)",
  "var(--font-sans)",
  "var(--font-serif)",
  "var(--font-pixel)",
];

/**
 * One CSS paper-scrap letter. `k` is the letter's position plus the word's
 * seed — it deterministically picks the scrap color, rotation, font, and
 * case. Also used as the fallback in RansomImageText when a letter image
 * doesn't exist yet.
 */
export function ScrapLetter({ char, k }: { char: string; k: number }) {
  const bg = SCRAP_COLORS[(k * 5 + 3) % SCRAP_COLORS.length];
  const rot = ROTATIONS[(k * 3 + 1) % ROTATIONS.length];
  const font = FONTS[(k * 7 + 2) % FONTS.length];
  const upper = (k * 11 + 5) % 3 !== 0;
  return (
    <span
      aria-hidden="true"
      className="ransom-letter"
      style={{
        backgroundColor: bg,
        color: LIGHT_SCRAPS.has(bg) ? "#3a2a14" : "#f7f2e6",
        transform: `rotate(${rot}deg)`,
        fontFamily: font,
      }}
    >
      {upper ? char.toUpperCase() : char.toLowerCase()}
    </span>
  );
}

export default function RansomText({
  text,
  seed = 0,
  className = "",
}: {
  text: string;
  seed?: number;
  className?: string;
}) {
  return (
    <span className={`ransom ${className}`} aria-label={text} role="text">
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i} className="ransom-space" aria-hidden="true" />
        ) : (
          <ScrapLetter key={i} char={char} k={i + seed} />
        )
      )}
    </span>
  );
}
