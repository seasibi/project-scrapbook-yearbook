"use client";

import { useState } from "react";

const EXTS = ["jpg", "JPG", "jpeg", "JPEG", "png", "PNG", "webp"];

/**
 * The adviser's photo, dropped into public/coder/ as master-coder.<ext>
 * (jpg/png/webp). Until then a hand-drawn "drop a photo here" placeholder
 * keeps the polaroid's portrait shape.
 */
function CoderPhoto() {
  const [i, setI] = useState(0);

  if (i >= EXTS.length) {
    return (
      <svg
        viewBox="0 0 100 130"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="coder-photo-ph"
      >
        <rect width="100" height="130" fill="var(--paper)" />
        <circle cx="50" cy="50" r="17" fill="none" stroke="var(--card-border)" strokeWidth="1.6" />
        <path
          d="M22 106c3-19 15-29 28-29s25 10 28 29"
          fill="none"
          stroke="var(--card-border)"
          strokeWidth="1.6"
        />
        <text
          x="50"
          y="124"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="4.4"
          fill="var(--ink-soft, #6e5a42)"
          opacity="0.7"
        >
          drop /coder/master-coder.jpg
        </text>
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/coder/master-coder.${EXTS[i]}`}
      alt="Fernando Jose Bautista, the master coder"
      className="coder-photo-img"
      draggable={false}
      onError={() => setI((v) => v + 1)}
    />
  );
}

/**
 * "A message from the master coder" — a two-page scrapbook spread: a taped
 * polaroid of the adviser on the left, an aged notebook-paper letter on the
 * right. Stacks to a single column on narrow screens.
 */
export default function MasterCoderMessage() {
  return (
    <div className="coder-spread reveal">
      <figure className="coder-photo-side">
        <div className="coder-polaroid">
          <span className="coder-tape" aria-hidden="true" />
          <div className="coder-photo">
            <CoderPhoto />
          </div>
          <figcaption className="coder-name">Fernando Jose Bautista, BSIT</figcaption>
        </div>
      </figure>

      <article className="coder-letter">
        <span className="coder-clip" aria-hidden="true" />
        <h3 className="coder-letter-head">
          A message from{" "}
          <span className="coder-letter-head-em">the master coder</span>
        </h3>
        <div className="coder-letter-body">
          <p>Hello, my dear students,</p>
          <p>
            <strong>Congratulations, Graduates!</strong> It feels like just
            yesterday we met in your first year. I still remember how shy we all
            were. Now, you are ready to begin a new chapter. I am truly,
            super-duper happy and proud of everything you have achieved.
          </p>
          <p>
            To be honest, becoming a teacher was not my first plan. Looking
            back, I am thankful that I accepted this opportunity because it gave
            me the chance to meet all of you. You were my first batch of
            students, and I was also a first-year teacher. We learned and grew
            together (not in height&nbsp;😅), and that is something I will always
            remember.
          </p>
          <p>
            Thank you for all the memories we shared over the years. From our
            class discussions and coding sessions to the simple chika and
            laughter, every moment became part of my journey. I hope our classes
            were not only a place to learn but also a place where you felt
            comfortable asking questions, making mistakes, and doing your best.
          </p>
          <p>
            As you begin this new chapter, I hope you continue to learn, stay
            humble, and never stop believing in yourselves. There will be
            challenges along the way, but I know each of you can achieve great
            things. Congratulations once again, and I wish you all the happiness
            and success in whatever path you choose.
          </p>
          <p>
            I will always be proud of my very first batch.{" "}
            <em>Haan kay makalipat aa ney…</em> taadowww!
          </p>
        </div>
        <p className="coder-sign">— your master coder</p>
      </article>
    </div>
  );
}
