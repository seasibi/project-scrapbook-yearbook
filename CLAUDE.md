@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Read it at the start of every session.

## 1. Project Overview

"The Memoirs — Class of 2026" is an interactive digital yearbook web app: a flippable book, searchable student portraits, a filterable photo gallery, an auth-gated dedications wall, and a global drag-and-drop sticker layer. The whole site sits behind a countdown gate until July 3, 2026 (early-access password: `memoirs2026`). Visual design follows the Canva "home" design ("The Archive" scrapbook look): cream notebook-grid paper, ransom-note cut-out lettering, polaroids with washi tape, plus a night palette behind a theme toggle.

## 2. Tech Stack (exact versions)

| Layer       | Technology                                            |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js 16.2.9 (App Router, Turbopack)                 |
| UI          | React 19.2.4 / react-dom 19.2.4                        |
| Language    | TypeScript ^5 (strict)                                 |
| Styling     | TailwindCSS ^4 (via @tailwindcss/postcss ^4) + custom CSS variables in `app/globals.css` |
| Database    | LibSQL/SQLite — @libsql/client ^0.17.3 (`yearbook.db`, auto-created on first request) |
| Auth        | jsonwebtoken ^9.0.3 (JWT in `yk_token` httpOnly cookie) + bcryptjs ^3.0.3 (bcrypt hashing) |
| Flipbook    | react-pageflip ^2.0.3 (SSR-disabled via `next/dynamic`) |
| Motion      | framer-motion ^12.40 — only inside `components/animations/` (scroll-driven patterns) |
| Fonts       | next/font/google: Playfair Display (`--font-serif`), DM Sans (`--font-sans`), Press Start 2P (`--font-pixel2`); next/font/local: Providence Sans (`app/fonts/ProvidenceSans.ttf`, `--font-pixel` — the scribble accent font) |
| Lint        | eslint ^9 + eslint-config-next 16.2.9                  |

### Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build (also the type-check; run before declaring work done)
- `npm start` — serve the production build
- `npm run lint` — ESLint
- There is no test suite. Verify behavior with `npm run build` plus a manual smoke test of the affected API route or page.

### Architecture in one paragraph

`app/page.tsx` (server component) loads JSON seed data via `lib/data.ts` and renders `components/YearbookShell.tsx` (client orchestrator). YearbookShell wraps everything in `AuthProvider` → `CountdownGate` → `ShellContent`; **all DOM observers (scroll reveal, active-nav tracking) must live in `ShellContent`, not above it**, because the gate only mounts its children after unlock. Static content (students, gallery, seed messages) comes from `data/*.json`; user-generated content (accounts, dedications, stickers) lives in SQLite via `lib/db.ts`, which lazily creates tables on first use. API routes under `app/api/` are thin wrappers over `lib/db.ts` / `lib/data.ts`; auth state is read from the request cookie with `getSessionUser()` in `lib/auth.ts`. Registration validates `fullName` against `data/students.json` — one account per graduate.

## 3. Naming & Coding Conventions

- Components: PascalCase files in `components/`, one default export per file. Hooks/utilities: camelCase in `lib/`. Shared types and the `STICKERS` catalog live in `types/index.ts` only.
- Client components start with `"use client"`; keep `app/page.tsx` and API routes server-only. Import via the `@/*` alias, never relative `../`.
- Styling is custom CSS classes in `app/globals.css` (kebab-case, section-prefixed: `gate-*`, `topbar-*`, `spread-*`, `tray-*`…), themed exclusively through CSS variables defined under `:root`/`[data-theme="night"]`. Never hardcode colors in components — add a variable. Tailwind utilities are available but the established pattern is semantic classes.
- Animations: CSS keyframes in `globals.css` (`fadeUp`, `stickerLand`, …) for page chrome; framer-motion is allowed **only** inside `components/animations/` (the reusable scroll-pattern library: QuoteReveal, ParallaxImage, StickySection, NameTicker, MemoryWords, StackingCards). Page-level scroll entrances use the `.reveal` class handled by `lib/useScrollReveal.ts`; per-element reveals in animation components use `hooks/useScrollReveal.ts` (`{ ref, isVisible }`). Both follow progressive enhancement: content must stay visible without JS (`body.js-ready` + 800ms fallback). All motion respects `prefers-reduced-motion`.
- Global base font is `html { font-size: 20px }` — size new UI in rem against that base.
- API routes return `NextResponse.json({ … })` on success and `{ error: "human-readable message" }` with a proper status code on failure; user-facing copy is lowercase-casual in pixel-font UI, sentence case in errors.
- SQL: snake_case columns, parameterized queries only (`client.execute({ sql, args })`). Map rows to camelCase TypeScript interfaces at the route boundary.

## 4. Files Claude Should NOT Touch

- `yearbook.db` (and `-journal`/`-wal` files) — live user data; never edit, delete, or commit. Schema changes go through `lib/db.ts` only.
- `public/yearbook-pdf/` — reserved drop zone for the user's Canva PDF exports (`full.pdf` + one per section). Don't generate placeholder PDFs here.
- `public/letters/` — user-managed drop zone for Canva cut-out letter PNGs (`<char>.png`, variants `<char>-<n>.png`) used by `RansomImageText`; don't generate art here beyond the README.
- `public/yearbook-pages/` — user-managed drop zone for Canva flipbook page exports (`1.png`, `2.png`, … read by `getYearbookPages()`); the flipbook falls back to generated spreads while empty. Don't generate pages here beyond the README.
- `data/students.json` — the canonical graduate list that registration validates against; do not rename/remove entries without explicit instruction (existing accounts reference these names).
- Generated/managed files: `.next/`, `node_modules/`, `package-lock.json` (beyond what `npm install` itself changes), `next-env.d.ts`.
