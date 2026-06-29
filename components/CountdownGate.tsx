"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import RansomImageText from "@/components/RansomImageText";

const GRADUATION = new Date("2026-07-03T00:00:00");
const EARLY_ACCESS_PASSWORD = "nextpass";
const SESSION_KEY = "memoirs-unlocked";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft | null {
  const diff = GRADUATION.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

export default function CountdownGate({ children }: { children: ReactNode }) {
  // null = still deciding (avoids a hydration flash)
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [seeds] = useState(() => [
    Math.floor(Math.random() * 100),
    Math.floor(Math.random() * 100),
  ]);
  const [heartIdx] = useState(() => Math.floor(Math.random() * 4) + 1);
  const [deco] = useState(() => [
    { src: "/letters/star-1.png", x: 5 + Math.random() * 12, y: 5 + Math.random() * 10, rot: Math.round((Math.random() * 30 - 15) * 10) / 10, scale: 0.7 + Math.random() * 0.4 },
    { src: "/letters/human-1.png", x: 80 + Math.random() * 12, y: 6 + Math.random() * 10, rot: Math.round((Math.random() * 24 - 12) * 10) / 10, scale: 0.7 + Math.random() * 0.4 },
    { src: "/letters/star-1.png", x: 78 + Math.random() * 14, y: 75 + Math.random() * 12, rot: Math.round((Math.random() * 30 - 15) * 10) / 10, scale: 0.6 + Math.random() * 0.4 },
    { src: "/letters/human-1.png", x: 3 + Math.random() * 12, y: 78 + Math.random() * 12, rot: Math.round((Math.random() * 24 - 12) * 10) / 10, scale: 0.6 + Math.random() * 0.4 },
  ]);

  useEffect(() => {
    let timer: number | undefined;
    // the unlock decision needs sessionStorage, so it runs client-side in a
    // 0ms task — keeps the effect body free of sync setState
    const decide = window.setTimeout(() => {
      const open =
        getTimeLeft() === null ||
        sessionStorage.getItem(SESSION_KEY) === "1";
      setUnlocked(open);
      if (open) return;

      setTimeLeft(getTimeLeft());
      timer = window.setInterval(() => {
        const t = getTimeLeft();
        setTimeLeft(t);
        if (t === null) setUnlocked(true);
      }, 1000);
    }, 0);
    return () => {
      window.clearTimeout(decide);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (password.trim().toLowerCase() === EARLY_ACCESS_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  }

  if (unlocked === null) {
    return <div className="gate-loading pixel-font">loading…</div>;
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="countdown-gate">
      <p className="gate-eyebrow pixel-font">class of 2026</p>
      <h1 className="gate-title">
        <span className="gate-title-line">
          <RansomImageText text="thank u" seed={seeds[0]} introDelay={0.2} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/letters/comma-1.png" alt="," className="gate-title-comma-img" draggable={false} />
        </span>
        <br />
        <span className="gate-title-line">
          <RansomImageText text="next" seed={seeds[1]} introDelay={0.9} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/letters/heart-${heartIdx}.png`}
            alt="heart"
            className="gate-title-heart-img"
            draggable={false}
          />
        </span>
      </h1>
      <p className="gate-kicker pixel-font">i&#39;m so f*cking grateful</p>
      <p className="gate-sub pixel-font">unlocks on july 3, 2026</p>

      {timeLeft && (
        <div className="gate-clock">
          {(
            [
              [timeLeft.days, "days"],
              [timeLeft.hours, "hours"],
              [timeLeft.minutes, "minutes"],
              [timeLeft.seconds, "seconds"],
            ] as const
          ).map(([value, label]) => (
            <div className="gate-unit" key={label}>
              <span className="gate-number pixel-font">
                {String(value).padStart(2, "0")}
              </span>
              <span className="gate-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="gate-access">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/letters/earlyaccess-square-1.png"
          alt=""
          className="gate-access-bg"
          draggable={false}
        />
        <div className="gate-access-content">
          <label htmlFor="gate-password" className="gate-access-label pixel-font">do you have an early access?</label>
          <input
            id="gate-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`gate-access-input pixel-font ${error ? "glitch" : ""}`}
            aria-label="Early access password"
            placeholder="password"
          />
          <button type="submit" className="gate-access-btn pixel-font">
            enter
          </button>
          {error && <p className="gate-error pixel-font">wrong password</p>}
        </div>
      </form>

      {deco.map((d, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={d.src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="gate-deco"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            transform: `rotate(${d.rot}deg) scale(${d.scale})`,
          }}
        />
      ))}
    </div>
  );
}
