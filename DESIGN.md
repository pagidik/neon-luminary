# Design System — Neon Luminary

## Product Context
- **What this is:** Curated daily AI news briefing app
- **Who it's for:** Tech-savvy AI enthusiasts who want a quick, high-signal morning read
- **Space/industry:** AI news, tech briefings (peers: The Verge, Morning Brew, TLDR, Hacker News)
- **Project type:** Mobile-first web app (480px max), card-based feed with five tabs

## Aesthetic Direction
- **Direction:** Editorial/Magazine
- **Decoration level:** Intentional (thin ruled lines as dividers, subtle texture on hero)
- **Mood:** Premium morning newspaper on your phone. Confident, literate, unhurried. Authority through typography and restraint, not neon glow.
- **Key risks taken:** Light mode default (breaks from every AI product), extreme type scale (42px serif headlines), restrained single-accent color

## Typography
- **Display/Hero:** Instrument Serif (400) — modern editorial serif, positions the app as a publication not a tool. 42px featured, 28px standard headlines.
- **Body:** DM Sans (400, 500) — clean geometric sans, pairs perfectly with Instrument Serif. 14-15px body text.
- **UI/Labels:** DM Sans (600, uppercase, letter-spacing: 2px) — structural metadata
- **Data/Tables:** Geist Mono (400, 500, 600) — timestamps, counts, metadata. Supports tabular-nums.
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN
  ```
  Instrument+Serif:ital@0;1
  DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700
  Geist+Mono:wght@400;500;600
  ```
- **Scale:**
  - Hero headline: 42px / 1.06 line-height / -0.5px tracking
  - Standard headline: 28px / 1.12 / -0.3px
  - Subhead: 18px / 1.2
  - Body: 15px / 1.65
  - Small body: 13px / 1.5
  - Label: 10px / uppercase / 2px tracking
  - Mono meta: 11px / 0.5px tracking

## Color

### Light Mode (default)
- **Approach:** Restrained, single accent
- **Background:** #f5f0e8 (warm cream paper)
- **Surface elevated:** #ece7dd
- **Surface high:** #e2ddd3
- **Text primary:** #1a1816 (warm ink)
- **Text muted:** #6b6560
- **Text faint:** #9a9590
- **Accent:** #c45a2d (burnt sienna, the only color that "pops")
- **Accent muted:** rgba(196, 90, 45, 0.12)
- **Rule/Divider:** rgba(26, 24, 22, 0.12)
- **Rule strong:** rgba(26, 24, 22, 0.25)

### Dark Mode
- **Background:** #111113
- **Surface elevated:** #1a1a1d
- **Surface high:** #242428
- **Text primary:** #ede9e1 (warm off-white)
- **Text muted:** #8a8680
- **Text faint:** #5a5652
- **Accent:** #d4874a (warmer, lighter variant for dark backgrounds)
- **Accent muted:** rgba(212, 135, 74, 0.15)
- **Rule/Divider:** rgba(237, 233, 225, 0.1)
- **Rule strong:** rgba(237, 233, 225, 0.2)

### Semantic
- **Success:** #3d7a4a (light) / #6bc77a (dark)
- **Warning:** #b5882a (light) / #d4a24e (dark)
- **Error:** #b94040 (light) / #e05c5c (dark)
- **Info:** #4a6b8a (light) / #7c8aaa (dark)

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)
- **Card padding:** 24px
- **Section gap:** 48px
- **Story vertical padding:** 24px

## Layout
- **Approach:** Grid-disciplined
- **Max content width:** 480px (mobile-first, centered)
- **Container padding:** 24px horizontal
- **Border radius:** 4px (subtle, almost square. No bubbly rounds.)
- **Dividers:** 1px solid rules between stories instead of cards. Typography is the structure.

## Motion
- **Approach:** Intentional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Page transitions:** Existing slide-r/slide-l (keep, 320ms cubic-bezier)
- **Theme transition:** background/color 300ms ease
- **No:** bounce, spring, overshoot. Clean entries and exits only.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Light mode as default | Break from dark-theme AI convention. Cream paper positions as editorial publication. |
| 2026-04-04 | Instrument Serif for headlines | Serif headlines differentiate from every geometric-sans AI product. Signals editorial authority. |
| 2026-04-04 | Extreme type scale (42px hero) | Headlines fill the screen like a broadsheet front page. Creates physical presence per story. |
| 2026-04-04 | Single burnt sienna accent | Restrained palette. One warm accent does all the work. No category-specific neon colors. |
| 2026-04-04 | Rules instead of cards | Flat editorial layout with horizontal dividers. Typography provides structure, not box-shadows. |
