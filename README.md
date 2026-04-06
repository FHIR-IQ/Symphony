# Impact Engine

**The Impact-First AI Orchestrator** — A real-time strategy game for product managers in the pharmacy clinical ecosystem.

Built for Outcomes.com AI Office Hours, this app facilitates "The Billion Dollar Pivot" workshop where product squads design AI-powered pharmacy strategies and compete for CEO funding.

## Features

- **Real-time multiplayer** — Live lobby, presence, and voting via Supabase Realtime
- **AI Strategy Review** — Claude evaluates strategies using the IMPACT framework
- **Live Voting Dashboard** — Animated vote bars update in real-time
- **CEO Agent Verdict** — AI-powered dramatic winner reveal with confetti

## Quick Start

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and keys from Settings > API

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase and Anthropic API credentials.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start hosting or joining a game.

## Deployment

Deploy to Vercel with the Supabase integration:

```bash
npx vercel
```

Set environment variables in the Vercel dashboard or use the Supabase + Vercel integration for automatic key rotation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Backend | Supabase (Postgres + Realtime) |
| Styling | Tailwind CSS v4 |
| AI | Vercel AI SDK + Claude |
| Deployment | Vercel |

## Game Flow

1. **Host** creates a room and shares the 6-character code
2. **Players** join the lobby via room code
3. **Teams** form squads of 3-4 product managers
4. **Strategy** — each team defines a problem, outcome metric, JTBD, and MAS pattern
5. **AI Review** — Claude scores each strategy 1-10 using the IMPACT framework
6. **Voting** — all players vote for the most impactful strategy
7. **CEO Verdict** — AI CEO announces the winner with a dramatic speech and confetti

## License

MIT
