"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { LETTERS } from "@/lib/lettersManifest";
import { ScrapLetter } from "@/components/RansomText";

interface LetterData {
  char: string;
  src: string | null;
  rot: number;
  scale: number;
}

function randomPick(char: string): string | null {
  const variants = LETTERS[char];
  if (!variants || variants.length === 0) return null;
  return variants[Math.floor(Math.random() * variants.length)];
}

function buildWord(text: string): LetterData[] {
  return text.split("").map((raw) => {
    const char = raw.toLowerCase();
    return {
      char,
      src: /^[a-z]$/.test(char) ? randomPick(char) : null,
      rot: Math.round((Math.random() * 16 - 8) * 10) / 10,
      scale: Math.round((0.94 + Math.random() * 0.14) * 100) / 100,
    };
  });
}

export default function HeroRansom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLElement | null)[]>([]);
  const [words] = useState(() => [buildWord("The"), buildWord("Archive")]);
  const flat = words.flat();

  useLayoutEffect(() => {
    const els = lettersRef.current.filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // reduced motion: just fade the letters in at their resting position
    if (prefersReduced) {
      gsap.set(els, {
        opacity: 0,
        visibility: "visible",
        rotation: (i: number) => flat[i]?.rot ?? 0,
        scale: (i: number) => flat[i]?.scale ?? 1,
      });
      gsap.to(els, { opacity: 1, duration: 0.6, stagger: 0.04 });
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // 1. scatter off-screen (runs before paint via useLayoutEffect)
    gsap.set(els, {
      x: (i: number) => ((i % 2 === 0 ? 1 : -1) * (0.55 + Math.random() * 0.6)) * vw,
      y: () => (Math.random() - 0.5) * vh * 1.3,
      rotation: () => (Math.random() - 0.5) * 360,
      scale: () => 0.3 + Math.random() * 0.2,
      opacity: 1,
      visibility: "visible",
    });

    const tl = gsap.timeline({ delay: 0.2 });

    // 2. scatter → center as discrete frames. ONE stepped tween quantizes every
    //    property (x, y, rotation, scale) into 7 hard snaps over ~1.3s (~5fps):
    //    the letter holds a pose, then jumps to the next — claymation, not a
    //    smooth slide. Because the scatter set a random ±360° spin, the rotation
    //    snaps through several visibly different poses on the way in.
    tl.to(els, {
      x: 0,
      y: 0,
      rotation: (i: number) => flat[i]?.rot ?? 0,
      scale: (i: number) => flat[i]?.scale ?? 1,
      duration: 1.3,
      stagger: 0.12,
      ease: "steps(7)",
    });

    // 3. continuous stop-motion idle jitter — choppy 3-frame loop keeps the
    //    hand-made texture alive after the letters land
    tl.call(() => {
      els.forEach((el) => {
        gsap.to(el, {
          rotation: `+=${(Math.random() - 0.5) * 4}`,
          x: `+=${(Math.random() - 0.5) * 3}`,
          y: `+=${(Math.random() - 0.5) * 3}`,
          duration: 0.9 + Math.random() * 0.6,
          repeat: -1,
          yoyo: true,
          ease: "steps(3)",
          delay: Math.random() * 0.4,
        });
      });
    });

    return () => {
      tl.kill();
      gsap.killTweensOf(els);
    };
  }, [flat]);

  let idx = 0;

  return (
    <div className="hero-ransom" ref={containerRef} aria-label="The Archive">
      {words.map((word, wi) => (
        <span
          key={wi}
          className={`hero-ransom-word${wi === 0 ? " hero-ransom-word--sm" : ""}`}
        >
          {word.map((letter, li) => {
            const gi = idx++;
            return (
              <span
                key={li}
                ref={(el) => {
                  lettersRef.current[gi] = el;
                }}
                className="hero-ransom-letter"
                style={{ visibility: "hidden" }}
              >
                {letter.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={letter.src}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="ransom-img"
                  />
                ) : (
                  <ScrapLetter char={letter.char} k={gi} />
                )}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}
