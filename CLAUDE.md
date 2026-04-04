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

Deployed to Vercel. Config in `vercel.json`. No environment variables needed for the current static architecture.
