"use client";

import type { ReactNode } from "react";

/**
 * Chapter pin: the sticky layer (usually a big Playfair chapter title +
 * DM Sans small-caps label) holds the viewport while the scroll content
 * slides up and over it.
 */
export default function StickySection({
  stickyContent,
  scrollContent,
  triggerHeight = "200vh",
}: {
  stickyContent: ReactNode;
  scrollContent: ReactNode;
  triggerHeight?: string;
}) {
  return (
    <div className="relative">
      <div style={{ height: triggerHeight }}>
        <div className="sticky top-0 z-[1] flex h-screen items-center justify-center">
          {stickyContent}
        </div>
      </div>
      <div className="relative z-[2] -mt-[50vh]">{scrollContent}</div>
    </div>
  );
}
