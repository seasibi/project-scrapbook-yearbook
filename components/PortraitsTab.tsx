"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import StudentAvatar from "@/components/StudentAvatar";
import type { Student } from "@/types";

const TAPE_TILT = [-3, 2, -1.5, 2.5, -2, 1];
const CARD_TILT = [-1.5, 1.2, -0.8, 1.6, -1.1, 0.9, -1.8, 1.4, -0.6, 1.3];

// Drop badge images into public/letters/badge/ as badge-1.png, badge-2.png, …
// Update the number here to match how many you've added.
const BADGE_COUNT = 6;
const BADGE_POOL = Array.from({ length: BADGE_COUNT }, (_, i) => `/letters/badge/badge-${i + 1}.png`);

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

      <div ref={gridRef} className="portraits-rows">
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
                  <div style={{ position: "relative" }}>
                    <div className="portrait-frame">
                      <StudentAvatar student={student} />
                    </div>
                    {student.role && BADGE_POOL.length > 0 && (
                      <div
                        className="portrait-role-badge"
                        aria-label={student.role}
                        style={{
                          position: "absolute",
                          top: "-80px",
                          right: "-50px",
                          width: "clamp(100px, 16vw, 140px)",
                          height: "clamp(100px, 16vw, 140px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                          borderRadius: "100%",
                          overflow: "hidden",
                          boxShadow: "1px 2px 6px rgba(0,0,0,0.22)",
                          pointerEvents: "none",
                          transform: `rotate(${((gi * 7 + 3) % 5) * 3 - 6}deg)`,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={BADGE_POOL[gi % BADGE_POOL.length]}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                        <span
                          className="pixel-font"
                          style={{
                            position: "relative",
                            zIndex: 1,
                            fontSize: "clamp(0.65rem, 1.1vw, 0.85rem)",
                            lineHeight: 1.2,
                            textAlign: "center",
                            padding: "4px",
                            wordBreak: "break-word",
                            hyphens: "auto",
                            maxWidth: "66%",
                            textShadow: "0 1px 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.6)",
                          }}
                        >
                          {student.role}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="portrait-lastname">{student.lastName.toUpperCase()}</p>
                  <p className="portrait-firstname">{student.firstName} {student.middleName}</p>
                  {student.motto && <p className="portrait-motto">&ldquo;{student.motto}&rdquo;</p>}
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
