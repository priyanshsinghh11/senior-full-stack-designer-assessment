# Ajaia Design System V2 — Design Spec

> Navy is the brand. Sky is the accent. Everything else supports.

Ajaia is an enterprise AI consulting and implementation firm. This system targets the
fidelity of Linear, Stripe Enterprise, and top consulting decks: deep navy, a single
sky-blue accent, a geometric Poppins wordmark, and square-cornered structural CTAs.
Tokens live in `colors_and_type.css` — this doc is the human reference for *how* and
*when* to use them.

---

## 1. Brand voice

- **Audience.** Enterprise & government decision-makers — busy, technical-adjacent, risk-averse. Reward skimming.
- **Pronouns.** Ajaia is **we**; the customer is **you**. Never "I" or "they."
- **Casing.** Title Case headings · sentence case body & labels · UPPERCASE only as a tracked eyebrow tag (`SERVICES`, `PRODUCTS`).
- **Tone.** Confident not boastful · outcome-led (headers are benefits/verbs) · quantified ("in minutes," "without adding headcount").
- **Punctuation.** Em-dashes for connective tissue · curly quotes always (`'` `'` `"` `"`) · no emoji · exclamation marks only in CTA headlines.
- **Vocabulary.** *enterprise, secure, scalable, compliant, structured, multi-agent, knowledge-grounded, orchestrate, deploy.* Avoid *cutting-edge, revolutionary, game-changing, leverage, synergy.*
- **CTA pattern.** verb + object, ≤ 4 words — "Let's Connect", "Start a Proposal Demo", "Request a Security Overview".

---

## 2. Color

The palette is deliberately narrow. Only **two surfaces** ship: navy (`--ink-900`) and white (`--paper`). Alternate them between sections for tempo.

### Brand
| Token | Hex | Role |
| --- | --- | --- |
| `--ink-900` | `#001D6B` | Primary brand — large surfaces, headlines on light, CTA on light |
| `--ink-700` | `#0B2E8E` | Hover / pressed for ink-900, gradient bottom-stop |
| `--ink-600` | `#1B3FA3` | Deep accent type |
| `--sky-500` | `#6EA4E6` | Italic captions, mid accent |
| `--sky-400` | `#97C2F8` | **Accent** — eyebrows, primary CTA fill on dark, divider squares |
| `--sky-300` | `#B6D4FA` | Sky hover lift |
| `--sky-100` | `#E1EEFF` | Tint — soft fills, body on navy |
| `--sky-50`  | `#F1F7FF` | Faintest tint — section bg on light, table stripes |
| `--cream-100` | `#FFFFE6` | Warm display accent — **once per view, on dark only** |

### Neutrals
| Token | Hex | Role |
| --- | --- | --- |
| `--paper` | `#FFFFFF` | Light surface |
| `--paper-warm` | `#F0EDE5` | Warm off-white (docs / email canvas) |
| `--ink-ink` | `#1B1C1C` | Body on light |
| `--ink-muted` | `#272D3B` | Secondary on light |
| `--ink-subtle` | `#6B7280` | Caption, helper, placeholder |
| `--ink-faint` | `#9AA3AF` | Faint labels, monospace meta |
| `--line-light` | `rgba(0,0,0,0.08)` | Border on light |
| `--line-dark` | `rgba(255,255,255,0.10)` | Border on dark |

### Rules
- **sky-400 → ink-900** carries CTAs. Never sky-400 on white as a primary surface — it washes out.
- **cream-100** is a spice, not a sauce: one headline per dark view (typically the H3 subsection title).
- **No gradients** as primary surfaces. A subtle radial vignette on the hero is the only exception.
- **Contrast:** on navy → `#FFFFFF` or `--sky-100`. On white → `--ink-ink` or `--ink-muted`. Nothing else.

---

## 3. Typography

**Poppins everywhere** (display + sans). **Fragment Mono** for numeric / metadata / merge tags. Montserrat & Inter are bundled as legacy fallbacks only.

Scale is authored on the 1920px frame.

| Token | Size / line / track | Weight | Usage |
| --- | --- | --- | --- |
| `--fs-display` | 72 / 1.06 / −2.5% | 700 | Homepage hero only |
| `--fs-h1` | 52 / 1.10 / −2.5% | 700 | Product hero, page title |
| `--fs-h2` | 40 / 1.18 / −2% | 700 | Section opener |
| `--fs-h3` | 30 / 1.26 / −1.5% | 700 | Subsection |
| `--fs-h4` | 22 / 1.36 / −1% | 600 | Card titles |
| `--fs-h5` | 18 / 1.36 / −0.5% | 600 | Card title alt, CTA label |
| `--fs-body-lg` | 18 / 1.55 / −0.3% | 500 | Hero subtitle, lead |
| `--fs-body` | 16 / 1.6 / −0.2% | 400 | Default paragraph |
| `--fs-body-sm` | 14 / 1.55 / −0.1% | 400 | Helper, caption, table |
| `--fs-eyebrow` | 13 / 1.5 / +12% | 700 | Tracked UPPERCASE tag, sky-400 |
| `--fs-mono` | 13 / 1.55 / 0% | 500 | Numeric, ticker, metadata (Fragment Mono) |

**Rhythm.** Body sits on a 4px sub-grid. Headings get ≥ 16px below; section openers get ≥ 64px above. Never below 14px on screen; never above 18px outside a hero.

---

## 4. Spacing

Strict 4px grid:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128` → `--space-1 … --space-32`

- **Section padding** (1920): vertical 96–128px · horizontal 160px gutter · 1600px content max-width.
- **Card padding:** 32px interior · 24px between elements.
- **Inline form gap:** 12px input → submit.
- **Stack gaps:** 8 / 16 / 24 / 48 / 96 by level.

---

## 5. Shape — radii, borders, shadows

- **Radii.** Squareness is part of the identity. `--r-0: 0` is the default on CTAs and bands. Rounded corners (`--r-2: 10`, `--r-pill`) are reserved for inputs and soft secondary cards.
- **Borders.** `1px solid` only — `--line-light` on light, `--line-dark` on dark. No 2px, no double, no dashed.
- **Shadows.**
  - `--shadow-1` — `0 1px 2px rgba(0,29,107,0.06), 0 8px 24px -8px rgba(0,29,107,0.12)` — card on light.
  - `--shadow-2` — `0 24px 60px -20px rgba(0,29,107,0.35)` — modal / hero card.
  - No inner shadows.

---

## 6. Motion

Restrained. Each interactive element gets **one** of three:

- **fade** — `opacity 180ms ease-out`
- **lift** — `translateY(-1px)` + → `--shadow-2`, 180ms
- **shine** — CTA gets a sky-400 highlight sliding L→R on hover

Easing: `--ease: cubic-bezier(0.32, 0.72, 0, 1)`. Durations: `--dur-fast: 120ms` · `--dur: 180ms` · `--dur-slow: 320ms`. No bounce, spring, or parallax.

### Interactive states
| State | Treatment |
| --- | --- |
| Hover (button) | `shine` overlay; background unchanged |
| Hover (link) | navy → sky-400; underline appears |
| Hover (card) | `lift` |
| Pressed | `scale(0.985)`, 120ms |
| Focus | `outline: 2px solid var(--sky-400); outline-offset: 2px` |
| Disabled | `opacity: 0.4; pointer-events: none` |

---

## 7. Layout

- **Top nav** — fixed, 72px, `rgba(0,0,0,0.6)` + 10px backdrop-blur, logo-left / links-right.
- **Footer** — flush on `--ink-900`, large right-aligned logo lockup for a confident sign-off.
- The hero may break grid once for art direction; everything else snaps.

**Transparency/blur is used for exactly two patterns:** tag chip (`rgba(255,255,255,0.05)` + `blur(5px)`) and nav (`rgba(0,0,0,0.6)` + `blur(10px)`). No glassmorphism elsewhere.

---

## 8. Backgrounds & imagery

- Two surfaces only (navy / white), alternated for tempo.
- No hand-drawn illustrations, patterns, or gradient section backgrounds.
- A subtle **dotted particle field** is the only allowed photographic background (homepage hero).
- Product imagery is **photographic** — realistic product UI in use, warm foreground / dark screen.
- **Decorative squares:** a pair of 18×18px solid squares offset diagonally — placed at the corner of CTA bands and section dividers. Small, intentional, structural — Ajaia's terminal ball.

---

## 9. Iconography

Ajaia ships no unified icon set. Service-card glyphs are bespoke flat-blue PNGs (45×45, `--sky-400`). For everything else use **Lucide** (1.5px stroke, square caps, geometric).

- Monochromatic — `currentColor`, set by parent text color. Never multi-color.
- Default size 16px inline, 20–24px standalone.
- Emoji never in product UI; Unicode glyphs only in legal/footer.
- CTA arrow: custom right-arrow-with-trailing-tick (`assets/icons/cta-arrow.svg`).

> **Flag:** Lucide is the chosen open-source default, not Ajaia's own kit. Confirm before shipping; swap contracted SVGs into `assets/icons/` if they exist.

---

## 10. Where things live

| Path | What |
| --- | --- |
| `colors_and_type.css` | All tokens + base/semantic type classes — `<link>` it in |
| `assets/` | Logos, product imagery, service icons |
| `fonts/` | Poppins · Montserrat · Inter · Fragment Mono (variable woff2) |
| `templates/` | Reusable starting points (e.g. Welcome Email) |
| `ui_kits/website/` | Hi-fi React recreation of ajaia.ai |
| `preview/` | Design System review-tab cards |

**Sources.** Figma `Ajaia Website redesign.fig` (frames `1920w-light`, `1920w-light2`) · [ajaia.ai](https://ajaia.ai) · footer address 450 Park Avenue South, New York, NY 10016.
