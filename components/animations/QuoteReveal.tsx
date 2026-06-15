"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

/**
 * Letter-by-letter quote reveal driven by scroll position: each character
 * brightens (opacity 0.2 → 1, in the current theme's ink color) as the
 * quote travels up the viewport. Playfair Display italic.
 */
export default function QuoteReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "start 0.15"],
  });

  const chars = text.split("");

  return (
    <p
      ref={ref}
      className={`font-[family-name:var(--font-serif)] italic leading-snug ${className}`}
      style={{ color: "var(--ink)" }}
      aria-label={text}
    >
      {reducedMotion
        ? text
        : chars.map((char, i) => (
            <Char
              key={i}
              char={char}
              progress={scrollYProgress}
              range={[i / chars.length, (i + 1) / chars.length]}
            />
          ))}
    </p>
  );
}

function Char({
  char,
  progress,
  range,
}: {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <motion.span aria-hidden="true" style={{ opacity }}>
      {char}
    </motion.span>
  );
}
