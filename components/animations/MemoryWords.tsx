"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
    <span className="memory-words-wrap">
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          className="memory-word"
          initial={reducedMotion ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
