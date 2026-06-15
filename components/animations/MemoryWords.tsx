"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Cycles through memory words one at a time — the current word exits
 * upward while the next slides in from below (crossfade only under
 * prefers-reduced-motion).
 */
export default function MemoryWords({
  words,
  speed = 15,
  stagger = 0.5,
  delay = 0.5,
}: {
  words: string[];
  speed?: number;
  stagger?: number;
  delay?: number;
}) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  const duration = speed / Math.max(words.length, 1);

  useEffect(() => {
    if (words.length < 2) return;
    const start = window.setTimeout(() => {
      setIndex((i) => (i + 1) % words.length);
    }, delay * 1000);
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % words.length);
    }, (duration + stagger) * 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [words.length, duration, stagger, delay]);

  return (
    <span className="inline-grid overflow-hidden align-bottom [grid-template-areas:'word']">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          className="[grid-area:word] whitespace-nowrap"
          initial={reducedMotion ? { opacity: 0 } : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { y: -20, opacity: 0 }}
          transition={{ duration: Math.min(duration, 1.2), ease: "easeInOut" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
