# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Impact Engine** is a real-time multiplayer workshop app for Outcomes.com "AI Office Hours." Product management squads compete in "The Billion Dollar Pivot" — designing AI-powered pharmacy strategies and pitching for "CEO funding." Built for live, in-room use with 10-30 participants.

## Build & Run Commands

```bash
npm run dev      # Start development server (Next.js on localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run test     # Run Vitest unit tests
npm run test:e2e # Run Playwright E2E tests (starts dev server automatically)
```

## Tech Stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Supabase** (Postgres + Realtime subscriptions for live multiplayer)
- **Tailwind CSS v4** (via @tailwindcss/postcss)
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) for Claude API calls
- **Deployment**: Vercel

## Architecture

### Game State Machine

The app is a linear state machine driven by `game_sessions.status`:

`lobby` → `planning` → `voting` → `finished`

Phase transitions are triggered by the host player via Supabase updates. The main game page (`src/app/game/[sessionId]/page.tsx`) renders different components based on the current phase. Note: the component code uses a local `GamePhase` type with value `"teams"` for the initial in-game phase, which maps to the `"planning"` status in the database.

### Real-time Sync

All multiplayer state flows through **Supabase Realtime** postgres_changes subscriptions. The game page subscribes to changes on `game_sessions`, `teams`, and `players` tables filtered by `session_id`. There is no custom WebSocket server — Supabase handles all real-time communication.

### Player Identity

Players are identified by a UUID stored in `localStorage` (key: `impact-engine-player-id`). There is no authentication — identity is browser-local. The host is tracked via `game_sessions.host_id`.

### AI Integration

Two API routes call Claude via the Vercel AI SDK (`generateText`):

- **`/api/ai-critique`** — Evaluates team strategies using the IMPACT framework (Interesting, Meaningful, People-focused, Actionable, Clear, Testable). Returns a 1-10 score and structured feedback as JSON.
- **`/api/ceo-verdict`** — AI "CEO" picks a winner from all teams considering AI scores and peer votes. Returns a theatrical speech as JSON.

Both endpoints expect and parse raw JSON from Claude's text output (no streaming). On error, both return graceful fallback responses with HTTP 200.

The **`/api/vote`** route uses a separate Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for server-side write access, with upsert to enforce one vote per voter per session.

### Database

Schema lives in `supabase/schema.sql`. Four tables: `game_sessions`, `teams`, `players`, `votes`. One view: `leaderboard`. Types are manually defined in `src/lib/database.types.ts` (not auto-generated from Supabase).

### Key Domain Concepts

- **MAS Patterns**: Multi-Agent System architecture patterns (Sequential, Parallel, Coordinator) that teams select as part of their strategy — defined in `src/lib/game-utils.ts`
- **IMPACT Framework**: The scoring rubric Claude uses to evaluate strategies (Interesting, Meaningful, People-focused, Actionable, Clear, Testable)

## Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client access
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side Supabase access (used in vote API)
- `ANTHROPIC_API_KEY` — Claude API key (used by Vercel AI SDK)
