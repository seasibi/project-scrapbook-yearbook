"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthContext";
import type { Dedication, Student } from "@/types";

const MAX_LENGTH = 500;

type PanelMode = "login" | "register";

export default function DedicationsTab({ students }: { students: Student[] }) {
  const { user, loading, refresh, signOut } = useAuth();
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [mode, setMode] = useState<PanelMode>("login");

  // auth form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [authError, setAuthError] = useState("");
  const [busy, setBusy] = useState(false);

  // name autocomplete state
  const [nameFocused, setNameFocused] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const nameSuggestions = useMemo(() => {
    const q = fullName.trim().toLowerCase();
    if (q.length < 2) return [];
    return students.filter((s) => s.fullName.toLowerCase().includes(q)).slice(0, 5);
  }, [fullName, students]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) {
        setNameFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // write form state
  const [toName, setToName] = useState("");
  const [message, setMessage] = useState("");
  const [writeError, setWriteError] = useState("");
  const [sent, setSent] = useState(false);

  const loadDedications = useCallback(async () => {
    try {
      const res = await fetch("/api/dedications");
      const data = await res.json();
      setDedications(data.dedications ?? []);
    } catch {
      // leave the wall as-is on network failure
    }
  }, []);

  useEffect(() => {
    // deferred to a task so the effect body stays free of sync setState
    const t = window.setTimeout(loadDedications, 0);
    return () => window.clearTimeout(t);
  }, [loadDedications]);

  async function submitAuth(e: FormEvent) {
    e.preventDefault();
    setAuthError("");

    if (mode === "register") {
      if (password !== confirm) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
    }

    setBusy(true);
    try {
      const endpoint =
        mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? { fullName, username, password }
          : { username, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error ?? "Something went wrong.");
        return;
      }
      setPassword("");
      setConfirm("");
      await refresh();
    } catch {
      setAuthError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitDedication(e: FormEvent) {
    e.preventDefault();
    setWriteError("");
    setBusy(true);
    try {
      const res = await fetch("/api/dedications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toName, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWriteError(data.error ?? "Something went wrong.");
        return;
      }
      setToName("");
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      await loadDedications();
    } catch {
      setWriteError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dedications-layout">
      {/* ── the wall ─────────────────────────────────── */}
      <div className="dedications-wall">
        {dedications.map((d, i) => (
          <article
            className="dedication-card reveal"
            key={d.id}
            style={{ transitionDelay: `${Math.min(i * 40, 320)}ms` }}
          >
            <header>
              <span className="dedication-from pixel-font">
                {d.fromNick} · {d.fromName}
              </span>
              <span className="dedication-to">for {d.toName}</span>
            </header>
            <p className="dedication-message">{d.message}</p>
          </article>
        ))}
        {dedications.length === 0 && (
          <div className="empty-wall reveal">
            <p className="empty-wall-icon" aria-hidden="true">&#x1F4DD;</p>
            <p className="empty-wall-text pixel-font">
              this wall is waiting for the first memory — will it be yours?
            </p>
          </div>
        )}
      </div>

      {/* ── the panel ────────────────────────────────── */}
      <aside className="dedications-panel reveal" id="dedications-panel">
        <span className="tape-strip" aria-hidden="true" />

        {loading ? (
          <p className="pixel-font flicker">checking your session…</p>
        ) : user ? (
          <>
            <div className="panel-user">
              <span className="user-chip pixel-font">✦ {user.username}</span>
              <button type="button" className="link-button pixel-font" onClick={signOut}>
                sign out
              </button>
            </div>
            <h3 className="panel-title">Write a dedication</h3>
            <form onSubmit={submitDedication} className="panel-form">
              <label className="field-label pixel-font" htmlFor="ded-to">to</label>
              <input
                id="ded-to"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                placeholder="a classmate, a teacher, everyone…"
                required
              />
              <label className="field-label pixel-font" htmlFor="ded-msg">message</label>
              <textarea
                id="ded-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
                rows={5}
                placeholder="say what the hallways heard…"
                required
              />
              <span className="char-count pixel-font">
                {message.length}/{MAX_LENGTH}
              </span>
              {writeError && <p className="form-error pixel-font">{writeError}</p>}
              {sent && <p className="form-ok pixel-font">✦ posted to the wall</p>}
              <button type="submit" className="primary-button pixel-font" disabled={busy}>
                {busy ? "posting…" : "post it"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 className="panel-title">
              {mode === "login" ? "Sign in" : "Join the wall"}
            </h3>
            <form onSubmit={submitAuth} className="panel-form">
              {mode === "register" && (
                <>
                  <label className="field-label pixel-font" htmlFor="reg-name">
                    full name
                  </label>
                  <p className="field-note pixel-font">
                    start typing — pick your name from the list
                  </p>
                  <div className="name-autocomplete" ref={nameRef}>
                    <input
                      id="reg-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setNameFocused(true)}
                      placeholder="start typing your name…"
                      autoComplete="off"
                      required
                    />
                    {nameFocused && nameSuggestions.length > 0 && (
                      <ul className="name-suggestions" role="listbox">
                        {nameSuggestions.map((s) => (
                          <li key={s.id} role="option">
                            <button
                              type="button"
                              className="name-suggestion pixel-font"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setFullName(s.fullName);
                                setNameFocused(false);
                              }}
                            >
                              {s.fullName}
                              {s.nickname ? <span className="name-suggestion-nick">&ldquo;{s.nickname}&rdquo;</span> : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
              <label className="field-label pixel-font" htmlFor="auth-user">username</label>
              <input
                id="auth-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <label className="field-label pixel-font" htmlFor="auth-pass">password</label>
              <input
                id="auth-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
              {mode === "register" && (
                <>
                  <label className="field-label pixel-font" htmlFor="auth-confirm">
                    confirm password
                  </label>
                  <input
                    id="auth-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </>
              )}
              {authError && <p className="form-error pixel-font">{authError}</p>}
              <button type="submit" className="primary-button pixel-font" disabled={busy}>
                {busy ? "…" : mode === "login" ? "sign in" : "register"}
              </button>
            </form>
            <button
              type="button"
              className="link-button pixel-font"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setAuthError("");
              }}
            >
              {mode === "login"
                ? "no account? register here"
                : "already registered? sign in"}
            </button>
            <p className="panel-note">
              One account per graduate — pick your name from the list and choose a username + password.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}
