"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const GRADUATION = new Date("2026-07-03T00:00:00");
const EARLY_ACCESS_PASSWORD = "memoirs2026";
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
      <p className="gate-kicker pixel-font">class of 2026 · batch memoranda</p>
      <h1 className="gate-title">The Archive</h1>
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

      <form onSubmit={submit} className="gate-form">
        <label htmlFor="gate-password" className="gate-label-text pixel-font">do you have an early access?</label>
        <input
          id="gate-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`gate-input pixel-font ${error ? "glitch" : ""}`}
          aria-label="Early access password"
        />
        <button type="submit" className="gate-button pixel-font">
          enter
        </button>
      </form>
      {error && <p className="gate-error pixel-font">wrong password — try again</p>}
    </div>
  );
}
