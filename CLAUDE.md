# CLAUDE.md

## Project Overview

**Impact Engine** is an interactive, real-time workshop application for the "AI Office Hours" at Outcomes.com. It facilitates "The Billion Dollar Pivot" — a competitive simulation where product management squads design AI-powered pharmacy strategies and compete for "CEO funding."

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Backend/Auth**: Supabase (Postgres + Realtime)
- **Styling**: Tailwind CSS v4
- **AI**: Vercel AI SDK + Anthropic Claude
- **Deployment**: Vercel

## Build & Run Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
  app/
    page.tsx                    # Home — create/join game
    lobby/page.tsx              # Lobby — waiting room with live presence
    game/[sessionId]/page.tsx   # Main game — phases: teams, strategy, voting, finished
    api/
      ai-critique/route.ts     # AI strategy evaluation endpoint
      ceo-verdict/route.ts     # CEO agent final verdict endpoint
      vote/route.ts             # Vote casting endpoint
  components/
    TeamSetup.tsx               # Team creation and joining
    StrategyBuilder.tsx         # Multi-step strategy form + AI critique
    VotingDashboard.tsx         # Real-time voting with animated bars
    CEOVerdict.tsx              # Final reveal with confetti
  lib/
    supabase.ts                 # Supabase client
    database.types.ts           # TypeScript types for Supabase schema
    game-utils.ts               # Room codes, player IDs, MAS patterns
```

## Database

Schema is in `supabase/schema.sql`. Run it in Supabase SQL Editor to initialize.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude

## Game Flow

1. **Home**: Host creates a room, players join with a 6-character code
2. **Lobby**: Real-time player list, host starts game
3. **Team Setup**: Players form squads of 3-4
4. **Strategy Phase**: Teams fill out Problem Statement, Outcome Metric, JTBD, and MAS Pattern
5. **AI Review**: Claude evaluates each strategy using the IMPACT framework (1-10 score)
6. **Voting**: All players vote on best strategy, real-time animated leaderboard
7. **CEO Verdict**: AI CEO announces the "fully funded" winner with confetti
