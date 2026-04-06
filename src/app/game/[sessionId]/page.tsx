"use client";

import { useEffect, useState, useCallback, use } from "react";
import { supabase } from "@/lib/supabase";
import { generatePlayerId } from "@/lib/game-utils";
import type { GameSession, Team, Player } from "@/lib/database.types";
import TeamSetup from "@/components/TeamSetup";
import StrategyBuilder from "@/components/StrategyBuilder";
import VotingDashboard from "@/components/VotingDashboard";
import CEOVerdict from "@/components/CEOVerdict";
import TeamChat from "@/components/TeamChat";
import TestModePanel from "@/components/TestModePanel";
import { isTestMode } from "@/lib/test-mode";

type GamePhase = "teams" | "strategy" | "voting" | "finished";

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<GameSession | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [phase, setPhase] = useState<GamePhase>("teams");
  const [isHost, setIsHost] = useState(false);
  const [strategySubmitted, setStrategySubmitted] = useState(false);
  const [testMode] = useState(() => isTestMode());
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";

  const fetchAll = useCallback(async () => {
    const sessionRes = await supabase.from("game_sessions").select().eq("id", sessionId).single();
    const teamsRes = await supabase.from("teams").select().eq("session_id", sessionId);
    const playersRes = await supabase.from("players").select().eq("session_id", sessionId);

    if (sessionRes.data) {
      setSession(sessionRes.data);
      setIsHost(sessionRes.data.host_id === playerId);
      if (sessionRes.data.status === "voting") setPhase("voting");
      else if (sessionRes.data.status === "finished") setPhase("finished");
    }
    if (teamsRes.data) setTeams(teamsRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
  }, [sessionId, playerId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === "voting") setPhase("voting");
          else if (updated.status === "finished") setPhase("finished");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `session_id=eq.${sessionId}` },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `session_id=eq.${sessionId}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchAll]);

  const myPlayer = players.find((p) => p.id === playerId);
  const myTeam = teams.find((t) => t.id === myPlayer?.team_id);

  async function handleTeamsReady() {
    await fetchAll();
    setPhase("strategy");
  }

  async function handleStrategySubmitted() {
    setStrategySubmitted(true);
  }

  async function handleStartVoting() {
    await supabase
      .from("game_sessions")
      .update({ status: "voting" })
      .eq("id", sessionId);
  }

  async function handleFinishGame() {
    await supabase
      .from("game_sessions")
      .update({ status: "finished" })
      .eq("id", sessionId);
  }

  // Compute vote counts for CEO verdict
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    if (phase !== "finished") return;
    async function getVotes() {
      const { data } = await supabase
        .from("votes")
        .select("team_id")
        .eq("session_id", sessionId);
      const counts: Record<string, number> = {};
      data?.forEach((v) => {
        counts[v.team_id] = (counts[v.team_id] || 0) + 1;
      });
      setVoteCounts(counts);
    }
    getVotes();
  }, [phase, sessionId]);

  if (!session) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted">Loading game...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-border px-6 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">
              Impact Engine
            </h1>
            <span className="text-xs px-2 py-1 rounded-full bg-surface-light text-muted font-mono">
              {session.code}
            </span>
          </div>
          <span className="text-sm text-muted">
            {players.length} players &middot; {teams.length} teams
          </span>
        </div>

        {/* Phase Progress */}
        <div className="flex items-center gap-1">
          {(["teams", "strategy", "voting", "finished"] as GamePhase[]).map((p, i) => {
            const phaseLabels = { teams: "Teams", strategy: "Strategy", voting: "Voting", finished: "Results" };
            const phaseIndex = ["teams", "strategy", "voting", "finished"].indexOf(phase);
            const isActive = i === phaseIndex;
            const isDone = i < phaseIndex;
            return (
              <div key={p} className="flex items-center flex-1 gap-1">
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all ${
                      isDone ? "bg-success" : isActive ? "bg-primary" : "bg-surface-light"
                    }`}
                  />
                  <span className={`text-[10px] ${isActive ? "text-primary-light font-bold" : isDone ? "text-success" : "text-muted"}`}>
                    {phaseLabels[p]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team submission tracker during strategy phase */}
        {phase === "strategy" && teams.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{teams.filter((t) => t.ai_score !== null).length}/{teams.length} teams submitted</span>
            <div className="flex gap-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className={`w-2 h-2 rounded-full ${t.ai_score !== null ? "bg-success" : "bg-surface-light"}`}
                  title={`${t.name}: ${t.ai_score !== null ? "Submitted" : "Working..."}`}
                />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Phase: Team Setup */}
          {phase === "teams" && (
            <TeamSetup
              sessionId={sessionId}
              players={players}
              teams={teams}
              isHost={isHost}
              onTeamsReady={handleTeamsReady}
              onDataChanged={fetchAll}
            />
          )}

          {/* Phase: Strategy Building */}
          {phase === "strategy" && (
            <div className="space-y-6">
              {myTeam && !strategySubmitted ? (
                <>
                  <StrategyBuilder
                    teamId={myTeam.id}
                    teamName={myTeam.name}
                    onSubmitted={handleStrategySubmitted}
                  />
                  <TeamChat teamId={myTeam.id} />
                </>
              ) : strategySubmitted ? (
                <div className="text-center space-y-4 py-12 animate-fade-in">
                  <div className="text-5xl">&#9989;</div>
                  <h2 className="text-2xl font-bold">Strategy Submitted!</h2>
                  <p className="text-muted">
                    Waiting for all teams to finish their strategies...
                  </p>
                  {isHost && (
                    <button
                      onClick={handleStartVoting}
                      className="btn-primary mt-4"
                      data-testid="start-voting"
                    >
                      Start Voting Phase
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 py-12">
                  <p className="text-muted">
                    Join a team first to start building your strategy.
                  </p>
                </div>
              )}

              {/* Host controls */}
              {isHost && !strategySubmitted && (
                <div className="text-center pt-8 border-t border-border">
                  <button
                    onClick={handleStartVoting}
                    className="btn-secondary"
                    data-testid="skip-to-voting"
                  >
                    Skip to Voting (Host)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Phase: Voting */}
          {phase === "voting" && (
            <VotingDashboard
              sessionId={sessionId}
              teams={teams}
              myTeamId={myTeam?.id || null}
              isHost={isHost}
              onFinish={handleFinishGame}
            />
          )}

          {/* Phase: Finished */}
          {phase === "finished" && (
            <CEOVerdict
              sessionId={sessionId}
              teams={teams.map((t) => ({
                name: t.name,
                problem_statement: t.problem_statement,
                outcome_metric: t.outcome_metric,
                mas_pattern: t.mas_pattern,
                ai_score: t.ai_score,
                vote_count: voteCounts[t.id] || 0,
              }))}
            />
          )}
        </div>
      </div>

      {testMode && (
        <TestModePanel sessionId={sessionId} phase={phase} onAction={fetchAll} />
      )}
    </main>
  );
}
