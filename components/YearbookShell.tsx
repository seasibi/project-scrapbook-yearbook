"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import CountdownGate from "@/components/CountdownGate";
import { AuthProvider } from "@/components/AuthContext";
import RansomText from "@/components/RansomText";
import RansomImageText from "@/components/RansomImageText";
import PortraitsTab from "@/components/PortraitsTab";
import GalleryScroll from "@/components/GalleryScroll";
import DedicationsTab from "@/components/DedicationsTab";
import DownloadPdf from "@/components/DownloadPdf";
import ShowcaseSection from "@/components/ShowcaseSection";
import StickerLayer from "@/components/StickerLayer";
import { MemoryWords } from "@/components/animations";
import { useScrollReveal } from "@/lib/useScrollReveal";
import type { Student } from "@/types";

const YearbookFlipbook = dynamic(() => import("@/components/YearbookFlipbook"), {
  ssr: false,
  loading: () => <p className="pixel-font flicker flipbook-loading">opening the book…</p>,
});

const MEMORY_WORDS = ["Prom.", "Finals.", "Retreat.", "Friends.", "Class of 2026."];

const NAV = [
  { id: "yearbook", label: "yearbook" },
  { id: "portraits", label: "portraits" },
  { id: "gallery", label: "gallery" },
  { id: "dedications", label: "dedications" },
  { id: "download", label: "download" },
];

type Theme = "day" | "night";

export default function YearbookShell({
  students,
  yearbookPages = [],
}: {
  students: Student[];
  yearbookPages?: string[];
}) {
  // CountdownGate only mounts its children once unlocked, so all the
  // observers (scroll reveal, active nav section) must live inside
  // ShellContent — they need the sections to exist in the DOM.
  return (
    <AuthProvider>
      <CountdownGate>
        <ShellContent students={students} yearbookPages={yearbookPages} />
      </CountdownGate>
    </AuthProvider>
  );
}

function ShellContent({
  students,
  yearbookPages = [],
}: {
  students: Student[];
  yearbookPages?: string[];
}) {
  // safe to read localStorage in the initializer: ShellContent only mounts
  // client-side, after CountdownGate unlocks (it is never part of hydration)
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "day";
    return localStorage.getItem("memoirs-theme") === "night" ? "night" : "day";
  });
  const [activeSection, setActiveSection] = useState("yearbook");
  const mainRef = useRef<HTMLDivElement>(null);

  useScrollReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("memoirs-theme", theme);
  }, [theme]);

  // highlight the nav tab for the section currently in view
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.2, 0.5] }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="shell" ref={mainRef}>
          {/* ── sticky topbar ─────────────────────────── */}
          <header className="topbar">
            <span className="topbar-brand">
              <span className="topbar-brand-icon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/letters/i.png" alt="" aria-hidden="true" className="topbar-letter-img" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/letters/t.png" alt="" aria-hidden="true" className="topbar-letter-img" />
              </span>
              <span className="topbar-brand-name pixel-font">Batch 26</span>
            </span>
            <nav className="topbar-nav" aria-label="Sections">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`topbar-link ${activeSection === item.id ? "active" : ""}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme(theme === "day" ? "night" : "day")}
              aria-label={`Switch to ${theme === "day" ? "night" : "day"} mode`}
              title={theme === "day" ? "lights out" : "lights on"}
            >
              {theme === "day" ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
                </svg>
              )}
            </button>
          </header>

          {/* ── hero ──────────────────────────────────── */}
          <section className="hero" id="home">
            <h1 className="hero-title">
              <RansomImageText
                text="The"
                seed={2}
                className="ransom-img--sm"
                introDelay={0.3}
              />
              <RansomImageText text="Archive" seed={11} introDelay={0.75} />
            </h1>
            <p className="hero-sub pixel-font stagger-4">
              ✦ scrapbook edition · class of 2026 ✦
            </p>
            <hr className="hero-rule stagger-5" />
            <h2 className="hero-remember stagger-7">
              we remember{" "}
              <span className="hero-remember-words">
                <MemoryWords words={MEMORY_WORDS} />
              </span>
            </h2>
            <span className="scroll-hint stagger-7" aria-hidden="true">⌄</span>
          </section>

          {/* ── yearbook flipbook ─────────────────────── */}
          <section className="section" id="yearbook">
            <div className="section-label section-label--center reveal">
              <RansomImageText
                text="yearbook"
                seed={5}
                className="ransom-img--label"
                introDelay={0.15}
              />
            </div>
            <p className="section-sub section-sub--center pixel-font reveal">
              flip through the pages — drag a corner
            </p>
            <YearbookFlipbook students={students} pages={yearbookPages} />
          </section>

          {/* ── portraits ─────────────────────────────── */}
          <section className="section" id="portraits">
            <div className="section-label reveal" data-anim="slideLeft">
              <RansomText text="portraits" seed={17} className="ransom-small" />
            </div>
            <p className="section-sub pixel-font reveal">
              all thirty of us, in alphabetical order of chaos
            </p>
            <PortraitsTab initial={students} />
          </section>

          {/* ── gallery ───────────────────────────────── */}
          <section className="section" id="gallery">
            <div className="section-label reveal" data-anim="slideLeft">
              <RansomText text="gallery" seed={8} className="ransom-small" />
            </div>
            <p className="section-sub pixel-font reveal">
              three chapters of memories — just keep scrolling
            </p>
            <GalleryScroll />
          </section>

          {/* ── dedications ───────────────────────────── */}
          <section className="section" id="dedications">
            <div className="section-label reveal" data-anim="slideLeft">
              <RansomText text="dedications" seed={23} className="ransom-small" />
            </div>
            <p className="section-sub pixel-font reveal">
              the wall — sign in with your yearbook name to write
            </p>
            <DedicationsTab />
          </section>

          {/* ── pdf download ──────────────────────────── */}
          <section className="section section--paper" id="download">
            <span className="torn-edge top" aria-hidden="true" />
            <DownloadPdf />
            <span className="torn-edge bottom" aria-hidden="true" />
          </section>

          {/* ── animation showcase (demo patterns) ────── */}
          <ShowcaseSection students={students} />

          {/* ── footer ────────────────────────────────── */}
          <footer className="footer">
            <span className="pixel-font">made with &lt;3 · class of 2026</span>
            <span className="footer-fin">Batch 26 · fin.</span>
          </footer>

      <StickerLayer />
    </div>
  );
}
