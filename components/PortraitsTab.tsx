"use client";

import { useEffect, useRef, useState } from "react";
import StudentAvatar from "@/components/StudentAvatar";
import type { Student } from "@/types";

const TAPE_TILT = [-3, 2, -1.5, 2.5, -2, 1];

export default function PortraitsTab({ initial }: { initial: Student[] }) {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>(initial);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<number | undefined>(undefined);

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

      <div className="portraits-grid">
        {students.map((student, i) => (
          <article
            className="portrait-card reveal"
            key={student.id}
            style={{ transitionDelay: `${Math.min(i * 45, 450)}ms` }}
          >
            <span
              className="tape-strip"
              aria-hidden="true"
              style={{ transform: `translateX(-50%) rotate(${TAPE_TILT[i % TAPE_TILT.length]}deg)` }}
            />
            <div className="portrait-frame">
              <StudentAvatar student={student} />
            </div>
            <p className="portrait-lastname">{student.lastName.toUpperCase()}</p>
            <p className="portrait-firstname">{student.firstName} {student.middleName}</p>
            <p className="portrait-nick">&ldquo;{student.nickname}&rdquo;</p>
            <p className="portrait-motto">{student.role}</p>
          </article>
        ))}
        {students.length === 0 && (
          <p className="empty-note pixel-font">no portraits match &ldquo;{query}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
