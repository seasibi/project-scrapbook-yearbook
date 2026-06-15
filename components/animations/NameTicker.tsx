"use client";

import { Fragment } from "react";

/**
 * Infinite horizontal name marquee (pure CSS animation — keyframes live in
 * globals.css as `.name-ticker*`). Two copies of the list make the
 * translateX(0 → -50%) loop seamless. Pauses on hover.
 */
export default function NameTicker({
  names,
  speed = 40,
  separator = "✦",
}: {
  names: string[];
  speed?: number;
  separator?: string;
}) {
  const row = (copy: number) => (
    <div className="name-ticker-row" aria-hidden={copy > 0 ? "true" : undefined}>
      {names.map((name, i) => (
        <Fragment key={`${copy}-${i}`}>
          <span className="whitespace-nowrap">{name}</span>
          <span className="name-ticker-sep" aria-hidden="true">
            {separator}
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="name-ticker" role="marquee" aria-label={names.join(", ")}>
      <div
        className="name-ticker-track"
        style={{ animationDuration: `${speed}s` }}
      >
        {row(0)}
        {row(1)}
      </div>
    </div>
  );
}
