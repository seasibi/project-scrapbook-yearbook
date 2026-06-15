"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Parallax photo: the inner image is 130% of the container height and
 * drifts vertically as the container crosses the viewport. Wrap it in a
 * polaroid frame or torn-paper section for the scrapbook look.
 */
export default function ParallaxImage({
  src,
  alt,
  className = "",
  speed = 0.3,
}: {
  src: string;
  alt: string;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const range = 15 * speed * 100; // px
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        src={src}
        alt={alt}
        className="absolute left-0 w-full object-cover"
        style={{
          height: "130%",
          top: "-15%",
          y: reducedMotion ? 0 : y,
        }}
      />
    </div>
  );
}
