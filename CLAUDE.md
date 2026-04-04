# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neon Luminary is a curated daily AI news briefing app. It uses a **static JSON architecture** — news stories are manually curated into `public/news-data.json` (no API key or backend needed). The frontend fetches this JSON on load.

## Commands

```bash
npm install          # install dependencies
npm run dev          # local dev server at http://localhost:3000
npm run build        # production build
npm run start        # serve production build
```

No test runner or linter is configured.

## Architecture

This is a single-page Next.js 14 app with Pages Router. The entire UI lives in one file:

- **`pages/index.jsx`** — Complete app: design tokens (`C` object), utility functions, state management, inline styles, and all five tab views (Feed, Trends, Search, Saved, Profile). No component extraction or CSS modules.
- **`public/news-data.json`** — Static data source. Array of story objects with fields: `id`, `e` (emoji), `title`, `summary`, `whyItMatters`, `cat` (category), `src`, `url`, `tool` (boolean), `tags`. Has a top-level `updatedAt` timestamp.
- **`styles/globals.css`** — CSS reset, keyframe animations (`slideR`, `slideL`, `fadeUp`, `spin`, `toastIn`, `pulseGlow`, `livePulse`), and animation utility classes (`.slide-r`, `.slide-l`, `.fade-up`).
- **`pages/_app.js`** — Standard Next.js app wrapper, only imports globals.css.

There is no API route — the previous `pages/api/news.js` (referenced in README) was removed in favor of the static JSON approach.

## Key Design Decisions

- **All styles are inline** via a `S` object and per-component style literals. No CSS-in-JS library.
- **Fonts**: Space Grotesk (headings/labels) and Inter (body) loaded from Google Fonts via `<link>` in `<Head>`.
- **Categories** are hardcoded: `["LLMs","Tools","Startups","Research","Coding AI","Business"]`.
- **Mobile-first**: max-width 480px centered, swipe/drag navigation between stories, touch event handlers.
- **No persistence**: bookmarks, reactions, and settings reset on reload (all in React state).

## Deployment

Deployed to Vercel. Config in `vercel.json`. Optional: `ELEVENLABS_API_KEY` for premium TTS, otherwise free Edge TTS is used.

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
