"use client";

import { forwardRef, type ReactNode } from "react";

/**
 * A single flipbook page. react-pageflip requires its children to accept a
 * ref to the underlying DOM node.
 */
const YearbookPage = forwardRef<
  HTMLDivElement,
  { children: ReactNode; variant?: "page" | "cover" | "blank" | "image" }
>(function YearbookPage({ children, variant = "page" }, ref) {
  return (
    <div className={`book-page book-page--${variant}`} ref={ref}>
      {children}
    </div>
  );
});

export default YearbookPage;
