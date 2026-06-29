"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import StudentAvatar from "@/components/StudentAvatar";
import type { Student } from "@/types";

const TAPE_TILT = [-3, 2, -1.5, 2.5, -2, 1];
const CARD_TILT = [-1.5, 1.2, -0.8, 1.6, -1.1, 0.9, -1.8, 1.4, -0.6, 1.3];

export default function PortraitsTab({ initial }: { initial: Student[] }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>(initial);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<number | undefined>(undefined);
  const gridRef = useRef<HTMLDivElement>(null);
  const animatedRows = useRef(new Set<number>());

  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(async () => {
      if (!query.trim()) {
        setStudents(initial);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setStudents(data.students ?? []);
      } catch {
        // keep the previous results on network failure
      } finally {
        setSearching(false);
      }
    }, 200);
    return () => window.clearTimeout(debounce.current);
  }, [query, initial]);

  useEffect(() => {
    if (!gridRef.current || query.trim()) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const sentinels = gridRef.current.querySelectorAll<HTMLElement>(".portrait-row-sentinel");
    if (sentinels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const rowIdx = Number(
            (entry.target as HTMLElement).dataset.row
          );
          if (animatedRows.current.has(rowIdx)) return;
          animatedRows.current.add(rowIdx);
          observer.unobserve(entry.target);

          const row = entry.target as HTMLElement;
          const cards = row.querySelectorAll<HTMLElement>(".portrait-card");
          const tapes = row.querySelectorAll<HTMLElement>(".tape-strip");

          const tl = gsap.timeline();

          tl.to(cards, {
            y: 0,
            opacity: 1,
            rotation: (i: number) => CARD_TILT[(rowIdx * 4 + i) % CARD_TILT.length],
            duration: 0.6,
            stagger: 0.08,
            ease: "power3.in",
          });

          tl.to(cards, {
            y: -6,
            duration: 0.15,
            stagger: 0.05,
            ease: "power2.out",
          });
          tl.to(cards, {
            y: 0,
            rotation: 0,
            duration: 0.25,
            stagger: 0.05,
            ease: "power2.inOut",
          });

          tl.to(
            tapes,
            {
              opacity: 1,
              scaleX: 1,
              duration: 0.3,
              stagger: 0.06,
              ease: "power2.out",
            },
            "-=0.25"
          );
        });
      },
      { rootMargin: "0px 0px -30% 0px", threshold: 0.1 }
    );

    sentinels.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, [students, query]);

  const cols = 4;
  const rows: Student[][] = [];
  for (let i = 0; i < students.length; i += cols) {
    rows.push(students.slice(i, i + cols));
  }

  return (
    <div>
      <div className="portraits-toolbar reveal">
        <div className="search-box">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search a name, nickname, or @handle&hellip;"
            className="search-input pixel-font"
            aria-label="Search portraits"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              &#x2715;
            </button>
          )}
        </div>
        <span className={`portraits-count pixel-font ${searching ? "flicker" : ""}`}>
          {students.length} portrait{students.length === 1 ? "" : "s"}
        </span>
      </div>

      <div ref={gridRef}>
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="portrait-row-sentinel portraits-grid"
            data-row={ri}
          >
            {row.map((student, ci) => {
              const gi = ri * cols + ci;
              return (
                <article
                  className="portrait-card"
                  key={student.id}
                  style={{ opacity: 0, transform: "translateY(-140px)" }}
                >
                  <span
                    className="tape-strip"
                    aria-hidden="true"
                    style={{
                      transform: `translateX(-50%) rotate(${TAPE_TILT[gi % TAPE_TILT.length]}deg)`,
                      opacity: 0,
                      transformOrigin: "center",
                    }}
                  />
                  <div className="portrait-frame">
                    <StudentAvatar student={student} />
                  </div>
                  <p className="portrait-lastname">{student.lastName.toUpperCase()}</p>
                  <p className="portrait-firstname">{student.firstName} {student.middleName}</p>
                  {student.motto && <p className="portrait-motto">&ldquo;{student.motto}&rdquo;</p>}
                  {student.role && <p className="portrait-role">{student.role}</p>}
                  {student.instagram && (
                    <p className="portrait-socials">
                      <a
                        href={`https://instagram.com/${student.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portrait-social-link"
                      >
                        <svg viewBox="0 0 24 24" className="portrait-social-icon" aria-hidden="true">
                          <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                        </svg>
                        <span>{student.instagram.startsWith("@") ? student.instagram : `@${student.instagram}`}</span>
                      </a>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        ))}
        {students.length === 0 && (
          <p className="empty-note pixel-font">no portraits match &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
