"use client";

import { Children, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";

/**
 * Scrapbook page-layering: each card pins below the previous one
 * (sticky, offset by topOffset px per index) and the cards underneath
 * scale down slightly as the next one slides over them.
 */
export default function StackingCards({
  children,
  topOffset = 24,
}: {
  children: ReactNode[];
  topOffset?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const cards = Children.toArray(children);

  return (
    <div ref={containerRef} className="relative">
      {cards.map((card, i) => (
        <Card
          key={i}
          index={i}
          total={cards.length}
          topOffset={topOffset}
          progress={scrollYProgress}
          staticScale={reducedMotion === true}
        >
          {card}
        </Card>
      ))}
    </div>
  );
}

function Card({
  children,
  index,
  total,
  topOffset,
  progress,
  staticScale,
}: {
  children: ReactNode;
  index: number;
  total: number;
  topOffset: number;
  progress: MotionValue<number>;
  staticScale: boolean;
}) {
  // once the cards after this one start arriving, shrink toward the back
  const targetScale = 1 - (total - 1 - index) * 0.02;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div
      className="sticky"
      style={{ top: `${index * topOffset}px`, zIndex: index + 1 }}
    >
      <motion.div
        style={{
          scale: staticScale ? 1 : scale,
          transformOrigin: "top center",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
