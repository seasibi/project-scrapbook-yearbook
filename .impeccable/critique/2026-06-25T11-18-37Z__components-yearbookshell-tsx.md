---
target: components/YearbookShell.tsx
total_score: 23
p0_count: 0
p1_count: 2
timestamp: 2026-06-25T11-18-37Z
slug: components-yearbookshell-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No loading indicators for gallery, stickers, or dedications; search flicker is the only feedback |
| 2 | Match Between System and Real World | 4 | Language is perfectly matched — "the wall," "drag a corner," "say what the hallways heard" |
| 3 | User Control and Freedom | 2 | No undo for dedications, no edit. Sticker tray has no Escape/click-outside dismiss |
| 4 | Consistency and Standards | 3 | Consistent scrapbook language. Minor: portrait-role styled identically to portrait-lastname |
| 5 | Error Prevention | 2 | Password mismatch caught client-side, but no name autocomplete, no sticker delete confirmation |
| 6 | Recognition Rather Than Recall | 3 | Nav highlights active section. But "ephemera" category label is opaque; no name autocomplete in dedications |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, no flipbook arrow keys, no quick-jump to a portrait |
| 8 | Aesthetic and Minimalist Design | 3 | Strong focused identity. Developer instructions leak into download section |
| 9 | Error Recovery | 2 | Auth errors are clear but gallery photo failures are silent; sticker API errors swallowed |
| 10 | Help and Documentation | 1 | No help anywhere. No explanation of sticker system, registration requirements, or password gate |
| **Total** | | **23/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: This does NOT read as AI-generated. The ransom-note lettering system (real Canva cut-out PNGs with CSS scrap fallback, stop-motion intro animation), the gallery's scattered collage with per-piece choreography (toss, film-pull, photoDevelop sepia→clear, tape press), and the embedded TikTok frame are all highly specific, non-template moves. Fonts include reflex-reject list members (Playfair Display, DM Sans) but these are committed brand choices — identity-preservation applies. No side-stripe borders, gradient text, glassmorphism, hero-metric templates, or numbered section markers found. Section headings use ransom-note image lettering, not eyebrow labels.

**Deterministic scan**: 8 findings across 2 rules:
- **bounce-easing** (6 hits): `bowBounce` animation (globals.css:200, 534, 2255) and overshoot cubic-bezier `(0.34, 1.56, 0.64, 1)` (globals.css:1655, 1816, 2103). **Mostly false positives for this brand** — the bow bounce is a physical ribbon simulation, and the overshoot curves on tape-press/sticker-land/divider-reveal simulate physical objects settling. The FAB hover bounce (line 2255) is the one gratuitous use.
- **layout-transition** (2 hits): Gallery progress `transition: height` (globals.css:1854) — negligible on a 3px element. Mobile nav `transition: max-height, padding` (globals.css:2654) — valid finding; `grid-template-rows: 0fr → 1fr` would be smoother.

## Overall Impression

This is a genuine artifact with real personality — the scrapbook material language is deep, the gallery animation system is production-grade, and the ransom-note lettering is unlike anything in a template marketplace. The biggest gap isn't aesthetics; it's **resilience**. The experience breaks down at its most emotional moments: placeholder art floods the gallery, registration blocks dedications with hostile precision, and there's zero guidance for first-time visitors. The design is strong; the edges aren't hardened.

## What's Working

1. **The gallery animation system is extraordinary.** Per-piece choreography — photos toss in with overshoot, film strips pull down, tape presses after the photo lands, paperclips slide, ephemera gets rubber-stamped. The photoDevelop (sepia→clear) effect is premium. Comprehensive `prefers-reduced-motion` fallback. CSS scroll-driven parallax on watermarks via `animation-timeline: view()`. This is best-in-class scroll animation.

2. **The ransom-note lettering is genuinely original.** Dual-path (real Canva PNGs → CSS scrap fallback), stop-motion stepped keyframes with alternating `stopMotionInAlt`, deterministic color/rotation/font per letter, word-level "ready" gate for strict left→right cascade. This is a custom design system.

3. **The scrapbook material language is deep and consistent.** Washi tape with 45° striped gradients, polaroid padding, notebook-grid paper backgrounds, torn-paper edges via clip-path, paperclips, film strips, the TikTok phone frame — every surface has physical materiality. The night theme transforms materials convincingly.

## Priority Issues

**[P1] Empty and placeholder states undermine the emotional core.**
Gallery photos show a cheerful sky-and-hills SVG placeholder that clashes with the scrapbook aesthetic — it looks like a children's illustration, not a yearbook artifact. Up to 90 placeholders visible across 3 chapters. The download section shows developer instructions ("exports go in /public/yearbook-pdf/") in user-facing UI. Empty dedications wall says "the wall is empty" with no visual warmth.
**Why it matters**: For a scrapbook about real memories, "under construction" placeholders destroy the emotional premise. Visitors see a template, not an artifact.
**Fix**: Replace placeholder art with scrapbook-appropriate "photo here" sketches, remove developer hints, make the empty wall inviting ("this wall is waiting for the first memory — will it be yours?").
**Suggested command**: `/impeccable harden`

**[P1] Registration UX creates a hostile barrier at the emotional peak.**
Users arrive at dedications emotionally primed to write — then hit a registration wall requiring EXACT full name matching. No name autocomplete, no dropdown, no fuzzy match. The form note is the only guidance. "Claim your page" title implies creating a yearbook page, not posting a message.
**Why it matters**: This is the single biggest abandonment risk. A typo means rejection at the moment of highest emotional engagement.
**Fix**: Add autocomplete/typeahead for fullName searching students.json, show matched name for confirmation, soften error messages, rename "Claim your page" to "Join the wall" or similar.
**Suggested command**: `/impeccable harden`

**[P2] No keyboard navigation for the flipbook.**
No prev/next buttons, no arrow key support. Page counter says "click or drag a corner" but there's no visible affordance. On mobile, the drag gesture area is ambiguous.
**Why it matters**: The flipbook is the centerpiece interaction. Users who can't figure out the drag gesture (or use keyboard navigation) miss the whole section.
**Fix**: Add explicit prev/next arrow buttons flanking the book. Wire to `pageFlip().flipNext()`/`flipPrev()`.
**Suggested command**: `/impeccable audit`

**[P2] Mobile gallery loses its scrapbook magic.**
Below 720px, the scattered collage collapses to a vertical column. All doodles hidden. All rotations, overlaps, and spatial relationships gone. This is 60%+ of users for a yearbook shared via phone link.
**Why it matters**: The collage layout IS the gallery's personality. A vertical stack of polaroids is just an Instagram feed without Instagram.
**Fix**: Use a 2-column asymmetric layout with maintained (smaller) rotations. Keep some doodles. The collage-within-constraints is the point.
**Suggested command**: `/impeccable adapt`

**[P3] Touch targets too small for sticker controls.**
Sticker delete button is 17×17px, resize handle is 13×13px. Both well below 44×44px minimum. Instagram links in portraits are 0.6rem (12px) at 0.7 opacity.
**Why it matters**: Mobile users can't reliably tap delete/resize. Portrait social links are effectively invisible.
**Fix**: Enlarge to ≥44px touch targets, increase social link font-size and opacity.
**Suggested command**: `/impeccable audit`

## Persona Red Flags

**Jordan (First-Timer)**: Arrives from a shared link.
- Countdown gate password field has zero context — where do they find this password?
- Sticker system has no onboarding — stickers appear scattered with no explanation of origin or interaction model
- "Claim your page" implies creating a yearbook page, not registering to post messages. Will try to register, fail name match, and give up.
- "✦ posted to the wall" confirmation disappears after 2.5 seconds — blink and miss it
- No help, FAQ, or "what is this?" anywhere

**Casey (Distracted Mobile User)**: Phone, one-handed, shared via Instagram story.
- Gallery tries up to 7 HTTP extensions per missing photo (jpg→JPG→jpeg→JPEG→png→PNG→webp) — 7 requests per missing photo on slow connections
- Sticker tray fills entire mobile viewport, no swipe-to-dismiss
- Flipbook requires precise corner-drag with no visible buttons
- Touch targets for sticker controls are 13-17px (need ≥44px)
- Portrait social links at 0.6rem + 0.7 opacity are untappable

## Minor Observations

- `portrait-role` is styled identically to `portrait-lastname` (same serif font, weight, size) — roles look like duplicate last names
- The `bowBounce` animation on the sticker FAB hover (line 2255) is gratuitous — a subtle scale or lift would be more appropriate than a full bounce
- Mobile nav uses `max-height` transition which causes layout thrash; `grid-template-rows: 0fr → 1fr` would be GPU-composited
- The `ShowcaseSection` component exists but isn't rendered in YearbookShell — dead code
- PlaceholderArt's sky-and-hills scene clashes with the scrapbook aesthetic
- The self-censored "f*cking" in the gate — either commit to the word or use a different phrase; the asterisk reads as hedging

## Questions to Consider

- **What if the empty wall wasn't empty?** Seed it with 3-4 dedications from the creator so visitors see a living wall from day one.
- **What if registration happened at the moment of intent?** Let visitors browse freely, only surface the identity flow when they tap "post."
- **What if the gallery progress bar was a scrapbook element?** A filmstrip unrolling, tape extending, or Polaroid stack filling up instead of a 3px line.
- **What if there was a "find yourself" moment?** After signing in, auto-scroll to your portrait card with a highlight animation.
- **What does this feel like in 5 years?** The back cover says "Until the next chapter" but there's no mechanism for revisiting or evolving.
