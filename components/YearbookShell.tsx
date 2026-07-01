"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountdownGate from "@/components/CountdownGate";
import { AuthProvider } from "@/components/AuthContext";
import RansomText from "@/components/RansomText";
import RansomImageText from "@/components/RansomImageText";
import HeroRansom from "@/components/HeroRansom";
import PortraitsTab from "@/components/PortraitsTab";
import GalleryScroll from "@/components/GalleryScroll";
import DedicationsTab from "@/components/DedicationsTab";
import StickerLayer from "@/components/StickerLayer";
import { MemoryWords } from "@/components/animations";
import { useScrollReveal } from "@/lib/useScrollReveal";
import type { Student } from "@/types";

const YearbookFlipbook = dynamic(() => import("@/components/YearbookFlipbook"), {
  ssr: false,
  loading: () => <p className="pixel-font flicker flipbook-loading">opening the book…</p>,
});

const MEMORY_WORDS = ["Enrollments.", "Midterms.", "Finals.", "Alaya", "Capstone.", "Friends.", "Class of 2026."];

const NAV = [
  { id: "yearbook", label: "yearbook" },
  { id: "portraits", label: "portraits" },
  { id: "gallery", label: "gallery" },
  { id: "dedications", label: "dedications" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const flipbookRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const [heroStickers] = useState(() => {
    const pool = Array.from({ length: 19 }, (_, i) => `/letters/sticker/sticker-${i + 1}.png`);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    // 10 zones guaranteeing all four sides.
    // Right/bottom limits account for sticker width (~10%) and height (~14%)
    // so the sticker never bleeds outside the hero bounds.
    const zones = [
      { xMin: 2,  xMax: 13, yMin: 6,  yMax: 20 }, // top-left
      { xMin: 77, xMax: 88, yMin: 6,  yMax: 20 }, // top-right  (right edge ≤ 98%)
      { xMin: 2,  xMax: 11, yMin: 26, yMax: 48 }, // left-upper
      { xMin: 2,  xMax: 11, yMin: 50, yMax: 66 }, // left-lower
      { xMin: 78, xMax: 88, yMin: 26, yMax: 48 }, // right-upper (right edge ≤ 98%)
      { xMin: 78, xMax: 88, yMin: 50, yMax: 66 }, // right-lower (right edge ≤ 98%)
      { xMin: 3,  xMax: 22, yMin: 70, yMax: 83 }, // bottom-left (bottom edge ≤ 97%)
      { xMin: 26, xMax: 46, yMin: 72, yMax: 83 }, // bottom-center-left
      { xMin: 52, xMax: 72, yMin: 72, yMax: 83 }, // bottom-center-right
      { xMin: 74, xMax: 85, yMin: 70, yMax: 83 }, // bottom-right (right edge ≤ 95%)
    ];

    return zones.map((z, i) => ({
      src: shuffled[i % shuffled.length],
      x: z.xMin + Math.random() * (z.xMax - z.xMin),
      y: z.yMin + Math.random() * (z.yMax - z.yMin),
      rot: Math.round((Math.random() * 28 - 14) * 10) / 10,
      scale: 0.45 + Math.random() * 0.55,
    }));
  });

  useScrollReveal();

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!flipbookRef.current) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    gsap.set(flipbookRef.current, { scale: 0.8, opacity: 0 });

    gsap.to(flipbookRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: {
        trigger: flipbookRef.current,
        start: "top 65%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === flipbookRef.current) st.kill();
      });
    };
  }, []);

  // hero sticker scatter → land entry
  useLayoutEffect(() => {
    if (!heroRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(heroRef.current.querySelectorAll<HTMLElement>(".hero-sticker"));
    if (els.length === 0) return;

    if (prefersReduced) { gsap.set(els, { opacity: 1 }); return; }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    els.forEach((el) => {
      gsap.set(el, {
        x: (Math.random() - 0.5) * vw * 1.6,
        y: (Math.random() - 0.5) * vh * 1.4,
        rotation: (Math.random() - 0.5) * 400,
        scale: 0.2 + Math.random() * 0.3,
        opacity: 1,
      });
    });

    const tl = gsap.timeline({ delay: 1.6 });
    tl.to(els, {
      x: 0, y: 0,
      rotation: (i) => parseFloat(els[i]?.dataset.finalRot ?? "0"),
      scale: (i) => parseFloat(els[i]?.dataset.finalScale ?? "1"),
      duration: 1.1,
      stagger: { amount: 0.9, from: "random" },
      ease: "steps(7)",
    });
    return () => { tl.kill(); };
  }, []);

  // hero sticker idle jitter
  useEffect(() => {
    if (!heroRef.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const els = heroRef.current.querySelectorAll<HTMLElement>(".hero-sticker");
    if (els.length === 0) return;
    const tweens: gsap.core.Tween[] = [];
    els.forEach((el) => {
      tweens.push(gsap.to(el, {
        x: `+=${(Math.random() - 0.5) * 16}`,
        y: `+=${(Math.random() - 0.5) * 12}`,
        rotation: `+=${(Math.random() - 0.5) * 10}`,
        duration: 0.9 + Math.random() * 0.8,
        repeat: -1, yoyo: true,
        ease: "steps(3)",
        delay: 3.8 + Math.random() * 0.6,
      }));
    });
    return () => { tweens.forEach((t) => t.kill()); };
  }, []);

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
            <nav className={`topbar-nav ${menuOpen ? "open" : ""}`} aria-label="Sections">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`topbar-link ${activeSection === item.id ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="topbar-actions">
              <button
                type="button"
                className="hamburger"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
                <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
                <span className={`hamburger-bar ${menuOpen ? "open" : ""}`} />
              </button>
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
            </div>
          </header>

          {/* ── hero ──────────────────────────────────── */}
          <section className="hero" id="home" ref={heroRef}>
            <h1 className="hero-title">
              <HeroRansom />
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

            {heroStickers.map((s, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={s.src}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="hero-sticker"
                data-final-rot={s.rot}
                data-final-scale={s.scale}
                style={{
                  position: "absolute",
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: "clamp(120px, 16vw, 260px)",
                  height: "auto",
                  pointerEvents: "none",
                  opacity: 0,
                  zIndex: 0,
                }}
              />
            ))}
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
            <div ref={flipbookRef} className="flipbook-scroll-wrap">
              <YearbookFlipbook students={students} pages={yearbookPages} />
            </div>
          </section>

          <div className="section-divider" aria-hidden="true"><span className="section-divider-mark">✦</span></div>

          {/* ── portraits ─────────────────────────────── */}
          <section className="section" id="portraits">
            <div className="section-label section-label--center reveal">
              <RansomImageText text="portraits" seed={17} className="ransom-img--label" />
            </div>
            <p className="section-sub section-sub--center pixel-font reveal">
              all twenty-six of us, in alphabetical order of chaos
            </p>
            <PortraitsTab initial={students} />
          </section>

          <div className="section-divider" aria-hidden="true"><span className="section-divider-mark">✦</span></div>

          {/* ── gallery ───────────────────────────────── */}
          <section className="section" id="gallery">
            <div className="section-label section-label--center reveal">
              <RansomImageText text="gallery" seed={8} className="ransom-img--label" />
            </div>
            <p className="section-sub section-sub--center pixel-font reveal">
              a wall of memories — just keep scrolling
            </p>
            <GalleryScroll />
          </section>

          <div className="section-divider" aria-hidden="true"><span className="section-divider-mark">✦</span></div>

          {/* ── dedications ───────────────────────────── */}
          <section className="section" id="dedications">
            <div className="section-label section-label--center reveal">
              <RansomImageText text="dedications" seed={23} className="ransom-img--label" />
            </div>
            <p className="section-sub section-sub--center pixel-font reveal">
              the wall — sign in with your yearbook name to write
            </p>
            <DedicationsTab students={students} />
          </section>

          {/* ── footer ────────────────────────────────── */}
          <footer className="footer">
            <span className="pixel-font">made with &lt;3 · class of 2026</span>
            <span className="footer-rule" aria-hidden="true" />
            <span className="footer-fin">Batch 26 · fin.</span>
          </footer>

      <StickerLayer />
    </div>
  );
}
