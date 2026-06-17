"use client";

import RansomText from "@/components/RansomText";
import StudentAvatar from "@/components/StudentAvatar";
import {
  QuoteReveal,
  ParallaxImage,
  StickySection,
  NameTicker,
  StackingCards,
} from "@/components/animations";
import type { Student } from "@/types";

/* the gallery's sky/hills placeholder art as a data URI — swap for real photos */
const PLACEHOLDER_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 75" preserveAspectRatio="none">` +
      `<rect width="100" height="75" fill="#d7ebf7"/>` +
      `<g fill="#ffffff"><ellipse cx="62" cy="17" rx="13" ry="6.5"/><ellipse cx="53" cy="20" rx="9" ry="5"/><ellipse cx="71" cy="20" rx="9" ry="5"/></g>` +
      `<path d="M0 52C20 42 40 46 56 52s30 8 44-2v25H0z" fill="#a8cc62"/>` +
      `<path d="M0 61c28-8 58-4 100 2v12H0z" fill="#8fb84a"/>` +
    `</svg>`
  );

/**
 * Demo of the six framer-motion scroll patterns (components/animations/),
 * wired with real yearbook data. Behind the countdown gate like everything
 * else in the shell.
 */
export default function ShowcaseSection({ students }: { students: Student[] }) {
  const featured = students[25] ?? students[0];
  const stackPicks = students.slice(0, 4);

  return (
    <section className="section" id="showcase">
      <div className="section-label reveal" data-anim="slideLeft">
        <RansomText text="showcase" seed={29} className="ransom-small" />
      </div>
      <p className="section-sub pixel-font reveal">
        scroll experiments — placeholder content, real classmates
        (the memory-words cycle lives in the hero)
      </p>

      {/* pattern 1 — letter-by-letter quote reveal */}
      <div className="mx-auto mt-[18vh] mb-[14vh] max-w-3xl text-center">
        <QuoteReveal
          text={`”${featured.nickname}” — ${featured.fullName}, batch 2026`}
          className="text-[clamp(1.4rem,3.2vw,2.2rem)]"
        />
      </div>

      {/* pattern 4 — name ribbon ticker */}
      <NameTicker names={students.map((s) => s.nickname)} />

      {/* pattern 3 — sticky chapter pin, with pattern 2 inside the scroll content */}
      <StickySection
        triggerHeight="180vh"
        stickyContent={
          <div className="text-center">
            <p className="font-[family-name:var(--font-sans)] text-sm uppercase tracking-[0.3em]" style={{ color: "var(--ink-soft)" }}>
              chapter one
            </p>
            <h3 className="font-[family-name:var(--font-serif)] italic text-[clamp(2.6rem,7vw,4.5rem)]">
              Senior Year
            </h3>
          </div>
        }
        scrollContent={
          <div className="mx-auto flex max-w-xl flex-col items-center gap-8 pb-[10vh]">
            {/* pattern 2 — parallax image in a polaroid frame */}
            <figure
              className="w-full rotate-[-2deg] border p-3 pb-12 shadow-lg"
              style={{ background: "var(--paper)", borderColor: "var(--card-border)", boxShadow: "0 10px 24px var(--paper-shadow)" }}
            >
              <ParallaxImage
                src={PLACEHOLDER_PHOTO}
                alt="Senior year memory placeholder"
                className="aspect-[4/3] w-full"
                speed={0.3}
              />
              <figcaption className="pixel-font mt-4 text-center text-sm" style={{ color: "var(--ink-soft)" }}>
                the last first day · drop a real photo here
              </figcaption>
            </figure>
            <p
              className="max-w-md text-center font-[family-name:var(--font-serif)] italic text-lg"
              style={{ color: "var(--ink-soft)" }}
            >
              The chapter title stays pinned while the memories scroll over it —
              like turning a page that refuses to let go.
            </p>
          </div>
        }
      />

      {/* pattern 6 — stacking profile cards */}
      <div className="mx-auto mt-[8vh] max-w-md">
        <p className="pixel-font mb-6 text-center" style={{ color: "var(--ink-soft)" }}>
          ✦ the stack — keep scrolling ✦
        </p>
        <StackingCards topOffset={28}>
          {stackPicks.map((student) => (
            <article
              key={student.id}
              className="mb-8 border p-6 text-center"
              style={{
                background: "var(--paper)",
                borderColor: "var(--card-border)",
                boxShadow: "0 10px 24px var(--paper-shadow)",
              }}
            >
              <div className="mx-auto mb-3 w-28">
                <StudentAvatar student={student} />
              </div>
              <h4 className="font-[family-name:var(--font-serif)] text-xl">
                {student.fullName}
              </h4>
              <p className="font-[family-name:var(--font-serif)] italic" style={{ color: "var(--accent)" }}>
                “{student.nickname}”
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--ink-soft)" }}>
                {student.role}
              </p>
            </article>
          ))}
        </StackingCards>
      </div>
    </section>
  );
}
