---
target: components/YearbookShell.tsx
total_score: 23
p0_count: 0
p1_count: 2
timestamp: 2026-06-25T11-00-57Z
slug: components-yearbookshell-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading indicators for gallery, sticker placement, or dedication posting |
| 2 | Match Between System and Real World | 4 | Language perfectly matched — scrapbook metaphor is airtight |
| 3 | User Control and Freedom | 2 | No undo for dedications, sticker tray can't be dismissed with Esc |
| 4 | Consistency and Standards | 3 | Consistent scrapbook visual language; minor role/lastname styling overlap |
| 5 | Error Prevention | 2 | Good client-side validation but no confirmation before sticker delete |
| 6 | Recognition Rather Than Recall | 3 | Good nav highlighting but "ephemera" label assumes vocabulary |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, no flipbook arrow keys |
| 8 | Aesthetic and Minimalist Design | 3 | Strong visual identity, minor developer hints leak into UI |
| 9 | Error Recovery | 2 | Auth errors clear but gallery failures silently show placeholders |
| 10 | Help and Documentation | 1 | No tooltips, FAQ, or explanation of features |
| **Total** | | **23/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: PASS. Genuinely distinctive — ransom-note lettering, scattered collage gallery, TikTok phone frame. No absolute bans triggered. Fonts include reflex-reject members but identity-preservation applies.

**Deterministic scan**: 8 findings. 6 bounce-easing (3 false positives, 3 borderline), 2 layout-transition (both true positives at L1854 and L2654).

## Overall Impression

Aesthetic is extraordinary — one of the most distinctive digital yearbooks possible. But the functional layer is thin: no help, hostile registration, mobile experience loses the collage magic. Biggest opportunity: making it as generous to use as it is to look at.

## What's Working

1. Gallery animation system — per-piece choreography, photoDevelop sepia-to-clear, comprehensive reduced motion fallback.
2. Ransom-note lettering — dual-path (PNGs + CSS fallback), stop-motion intro, deterministic styling.
3. Scrapbook material language — washi tape, polaroids, notebook-grid, torn edges, TikTok frame, convincing night theme.

## Priority Issues

### [P1] Registration UX creates hostile barrier at emotional peak
No autocomplete, no fuzzy match, exact name required. Single biggest abandonment risk.

### [P1] Empty/placeholder states undermine emotional core
Generic sky SVG clashes with scrapbook aesthetic. Developer instructions leak into UI. Empty wall has no warmth.

### [P2] Mobile gallery loses scrapbook magic
Below 720px, collage becomes flat flex column. Doodles hidden, rotations gone. 60%+ of users on mobile.

### [P2] No keyboard navigation for flipbook
No arrow keys, no prev/next buttons. Drag-only on mobile.

### [P2] Layout-transition performance issues
height and max-height/padding transitions cause layout thrash.

## Persona Red Flags

**Jordan (First-Timer)**: Password field has no context, stickers unexplained, "Claim your page" misleading, name-matching causes abandonment, confirmation disappears in 2.5s.

**Casey (Mobile User)**: Sequential image extension fallback (7 requests per missing photo), sticker tray fills viewport, touch targets below 44×44px minimum, social links too small (12px + opacity 0.7), flipbook requires precise corner-drag.

## Minor Observations

- ShowcaseSection is dead code
- dangerouslySetInnerHTML for sticker SVGs — contained but risky if user SVGs added
- PlaceholderArt clashes with scrapbook aesthetic
- Self-censored "f*cking" reads as hedging
- 800ms JS-ready fallback may not be implemented

## Questions to Consider

- What if the empty wall wasn't empty? Seed with creator dedications.
- What if registration happened at moment of intent, not as a pre-gate?
- What if the gallery progress bar was a scrapbook element?
- What does this feel like in 5 years — is there a "you came back" moment?
