"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generatePlayerId } from "@/lib/game-utils";
import { TEAM_COLORS, MAS_PATTERNS, type MASPatternKey } from "@/lib/game-utils";
import type { Team } from "@/lib/database.types";

interface TeamWithVotes extends Team {
  vote_count: number;
}

interface Props {
  sessionId: string;
  teams: Team[];
  isHost: boolean;
  onFinish: () => void;
}

export default function VotingDashboard({ sessionId, teams, isHost, onFinish }: Props) {
  const [teamVotes, setTeamVotes] = useState<TeamWithVotes[]>([]);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";
  const maxVotes = Math.max(1, ...teamVotes.map((t) => t.vote_count));

  const fetchVotes = useCallback(async () => {
    const { data: votes } = await supabase
      .from("votes")
      .select("team_id")
      .eq("session_id", sessionId);

    const voteCounts: Record<string, number> = {};
    votes?.forEach((v) => {
      voteCounts[v.team_id] = (voteCounts[v.team_id] || 0) + 1;
    });

    const teamsWithVotes = teams.map((team) => ({
      ...team,
      vote_count: voteCounts[team.id] || 0,
    }));

    teamsWithVotes.sort((a, b) => b.vote_count - a.vote_count);
    setTeamVotes(teamsWithVotes);

    // Check if current user already voted
    const myVote = votes?.find(() => {
      return votes.some(
        (v) =>
          teams.some((t) => t.id === v.team_id)
      );
    });

    const existingVote = await supabase
      .from("votes")
      .select("team_id")
      .eq("voter_id", playerId)
      .eq("session_id", sessionId)
      .single();

    if (existingVote.data) {
      setVotedFor(existingVote.data.team_id);
    }
  }, [sessionId, teams, playerId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // Realtime vote updates
  useEffect(() => {
    const channel = supabase
      .channel(`votes-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` },
        () => fetchVotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchVotes]);

  async function castVote(teamId: string) {
    if (voting) return;
    setVoting(true);

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, voterId: playerId, sessionId }),
      });
      setVotedFor(teamId);
      await fetchVotes();
    } finally {
      setVoting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">The Impact-Off</h2>
        <p className="text-muted text-sm">
          Vote for the team with the most transformative strategy
        </p>
      </div>

      {/* Voting Bars */}
      <div className="space-y-4">
        {teamVotes.map((team, index) => {
          const barWidth =
            maxVotes > 0 ? (team.vote_count / maxVotes) * 100 : 0;
          const color = TEAM_COLORS[index % TEAM_COLORS.length];
          const isMyVote = votedFor === team.id;

          return (
            <div key={team.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold">{team.name}</span>
                  {team.ai_score && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-light">
                      AI: {team.ai_score}/10
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold" style={{ color }}>
                    {team.vote_count}
                  </span>
                  {!isMyVote ? (
                    <button
                      onClick={() => castVote(team.id)}
                      disabled={voting || !!votedFor}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Vote
                    </button>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-xl bg-success/20 text-success font-medium">
                      Your Vote
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="h-8 rounded-lg bg-surface-light/50 overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out flex items-center px-3"
                  style={{
                    width: `${Math.max(barWidth, 2)}%`,
                    backgroundColor: color,
                    opacity: 0.7,
                  }}
                />
              </div>

              {/* Team Details */}
              {team.problem_statement && (
                <div className="pl-7 text-xs text-muted">
                  <p>{team.problem_statement}</p>
                  {team.mas_pattern && (
                    <p className="text-secondary mt-1">
                      Pattern: {MAS_PATTERNS[team.mas_pattern as MASPatternKey]?.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {votedFor && (
        <p className="text-center text-sm text-success">
          Your vote has been cast! Watching results live...
        </p>
      )}

      {/* Host: End voting */}
      {isHost && (
        <div className="text-center pt-4">
          <button onClick={onFinish} className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
            Reveal CEO Verdict
          </button>
        </div>
      )}
    </div>
  );
}
