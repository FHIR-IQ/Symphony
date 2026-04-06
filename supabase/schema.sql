-- Impact Engine: Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Game Sessions
CREATE TABLE public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'lobby' CHECK (status IN ('lobby', 'planning', 'voting', 'finished')),
    host_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE public.players (
    id TEXT PRIMARY KEY,
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    team_id UUID,
    is_host BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    members TEXT[] DEFAULT '{}',
    problem_statement TEXT,
    outcome_metric TEXT,
    mas_pattern TEXT CHECK (mas_pattern IN ('sequential', 'parallel', 'coordinator', NULL)),
    job_to_be_done TEXT,
    ai_score INTEGER,
    ai_critique TEXT,
    ceo_funded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for players -> teams (after teams table exists)
ALTER TABLE public.players ADD CONSTRAINT fk_player_team
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- Votes (one vote per voter per session)
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voter_id, session_id)
);

-- Leaderboard View
CREATE VIEW public.leaderboard AS
SELECT
    v.team_id,
    t.name AS team_name,
    COUNT(*) AS vote_count
FROM public.votes v
JOIN public.teams t ON t.id = v.team_id
GROUP BY v.team_id, t.name;

-- Enable Row Level Security
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for workshop use)
CREATE POLICY "Allow all access to game_sessions" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to players" ON public.players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to votes" ON public.votes FOR ALL USING (true) WITH CHECK (true);

-- Team Chat Messages
CREATE TABLE public.team_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to team_messages" ON public.team_messages FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
