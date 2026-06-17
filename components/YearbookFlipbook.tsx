"use client";

import { useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import YearbookPage from "@/components/YearbookPage";
import StudentAvatar from "@/components/StudentAvatar";
import type { Student } from "@/types";

const STUDENTS_PER_SPREAD = 6;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * The flippable book. When Canva page exports exist in
 * public/yearbook-pages/ (1.png, 2.png, ...) the book shows those images --
 * page 1 as the front cover, the last page as the back. Until then it
 * falls back to the generated student spreads.
 */
export default function YearbookFlipbook({
  students,
  pages = [],
}: {
  students: Student[];
  pages?: string[];
}) {
  const [page, setPage] = useState(0);
  const bookRef = useRef(null);
  const hasExports = pages.length > 0;
  const spreads = chunk(students, STUDENTS_PER_SPREAD);
  const totalPages = hasExports ? pages.length : spreads.length + 3; // cover + blank + spreads + back

  return (
    <div className="flipbook-wrap reveal" data-anim="scaleIn">
      {/* @ts-expect-error react-pageflip's types predate React 19 */}
      <HTMLFlipBook
        ref={bookRef}
        width={420}
        height={560}
        size="stretch"
        minWidth={280}
        maxWidth={520}
        minHeight={380}
        maxHeight={700}
        flippingTime={700}
        showCover
        mobileScrollSupport
        maxShadowOpacity={0.45}
        onFlip={(e: { data: number }) => setPage(e.data)}
        className="flipbook"
      >
        {hasExports
          ? pages.map((src, i) => (
              <YearbookPage
                key={src}
                variant={i === 0 || i === pages.length - 1 ? "cover" : "image"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Yearbook page ${i + 1}`}
                  className="page-image"
                  draggable={false}
                  loading={i < 3 ? "eager" : "lazy"}
                />
              </YearbookPage>
            ))
          : [
              <YearbookPage variant="cover" key="cover">
                <div className="cover-inner">
                  <span className="cover-bow" aria-hidden="true">&#x1F380;</span>
                  <h3 className="cover-title">The Archive</h3>
                  <p className="cover-sub pixel-font">&#x2726; scrapbook edition &#x2726;</p>
                  <p className="cover-year">2026</p>
                </div>
              </YearbookPage>,

              <YearbookPage variant="blank" key="blank">
                <span />
              </YearbookPage>,

              ...spreads.map((group, i) => (
                <YearbookPage key={i}>
                  <div className="spread-header pixel-font">
                    the graduates &middot; {i + 1} of {spreads.length}
                  </div>
                  <div className="spread-grid">
                    {group.map((student) => (
                      <figure className="spread-card" key={student.id}>
                        <div className="spread-polaroid">
                          <StudentAvatar student={student} size={88} />
                        </div>
                        <figcaption>
                          <span className="spread-name pixel-font">{student.lastName.toUpperCase()}</span>
                          <span className="spread-name-first">{student.firstName} {student.middleName}</span>
                          <span className="spread-nick">&ldquo;{student.nickname}&rdquo;</span>
                          <span className="spread-quote">{student.role}</span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </YearbookPage>
              )),

              <YearbookPage variant="cover" key="back">
                <div className="cover-inner">
                  <h3 className="cover-fin">Fin.</h3>
                  <p className="cover-farewell">
                    Until the next chapter &mdash; wherever it finds us.
                  </p>
                </div>
              </YearbookPage>,
            ]}
      </HTMLFlipBook>

      <p className="flipbook-counter pixel-font">
        page {Math.min(page + 1, totalPages)} of {totalPages} &middot; click or drag a
        corner to flip
      </p>
    </div>
  );
}
