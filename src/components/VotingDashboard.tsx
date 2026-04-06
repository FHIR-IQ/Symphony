"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
  myTeamId: string | null;
  isHost: boolean;
  onFinish: () => void;
}

export default function VotingDashboard({ sessionId, teams, myTeamId, isHost, onFinish }: Props) {
  const [teamVotes, setTeamVotes] = useState<TeamWithVotes[]>([]);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";

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
    setTotalVotes(votes?.length || 0);

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
    async function fetchPlayers() {
      const { data } = await supabase
        .from("players")
        .select("id")
        .eq("session_id", sessionId);
      setTotalVoters(data?.length || 0);
    }
    fetchPlayers();
  }, [sessionId]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  useEffect(() => {
    const channel = supabase
      .channel(`votes-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` },
        () => fetchVotes()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, fetchVotes]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) setRevealed(true);
  }, [countdown]);

  function startCountdown() { setCountdown(5); }

  async function castVote(teamId: string) {
    if (voting || teamId === myTeamId) return;
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

  const maxVotes = Math.max(1, ...teamVotes.map((t) => t.vote_count));
  const allVoted = totalVoters > 0 && totalVotes >= totalVoters;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Image src="/images/voting-box.png" alt="" width={100} height={100} className="mx-auto animate-bounce-in rounded-2xl w-auto h-auto" />
        <h2 className="text-2xl font-bold">The Impact-Off</h2>
        <p className="text-muted text-sm">
          Read each team&apos;s strategy, then vote for the most transformative one
          {myTeamId && " (you cannot vote for your own team)"}
        </p>
      </div>

      {/* Vote progress */}
      <div className="text-center">
        <span className="text-sm text-muted">
          {totalVotes}/{totalVoters} votes cast
          {allVoted && !revealed && " \u2014 all votes are in!"}
        </span>
        <div className="mt-2 h-1.5 rounded-full bg-surface-light/50 max-w-xs mx-auto overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="space-y-4 stagger-children">
        {teamVotes.map((team, index) => {
          const barWidth = revealed && maxVotes > 0 ? (team.vote_count / maxVotes) * 100 : 0;
          const color = TEAM_COLORS[index % TEAM_COLORS.length];
          const isMyVote = votedFor === team.id;
          const isMyTeam = team.id === myTeamId;
          const isExpanded = expandedTeam === team.id;

          return (
            <div key={team.id} className="strategy-card">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold text-lg">
                    {team.name}
                    {isMyTeam && <span className="text-xs text-muted ml-2 font-normal">(your team)</span>}
                  </span>
                  {team.ai_score && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-light font-semibold">
                      AI: {team.ai_score}/10
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {revealed && (
                    <span className="text-xl font-bold animate-bounce-in" style={{ color }}>
                      {team.vote_count}
                    </span>
                  )}
                  {!revealed && !isMyTeam && !isMyVote && (
                    <button
                      type="button"
                      onClick={() => castVote(team.id)}
                      disabled={voting || !!votedFor}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Vote
                    </button>
                  )}
                  {isMyVote && (
                    <span className="text-xs px-3 py-1.5 rounded-xl bg-success/20 text-success font-semibold">
                      Your Vote
                    </span>
                  )}
                  {!revealed && isMyTeam && !isMyVote && (
                    <span className="text-xs px-3 py-1.5 text-muted italic">
                      Can&apos;t self-vote
                    </span>
                  )}
                </div>
              </div>

              {/* Strategy Preview */}
              {team.problem_statement && (
                <div className="mb-3">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {isExpanded ? team.problem_statement : team.problem_statement.slice(0, 150) + (team.problem_statement.length > 150 ? "..." : "")}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {team.mas_pattern && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                        {MAS_PATTERNS[team.mas_pattern as MASPatternKey]?.name}
                      </span>
                    )}
                    {team.outcome_metric && (
                      <span className="text-xs text-muted truncate max-w-[200px]">
                        Target: {team.outcome_metric}
                      </span>
                    )}
                    {team.problem_statement.length > 150 && (
                      <button
                        type="button"
                        onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                        className="text-xs text-primary-light hover:underline ml-auto"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Vote bar — after reveal */}
              {revealed && (
                <div className="h-6 rounded-lg bg-surface-light/50 overflow-hidden">
                  <div
                    className="h-full rounded-lg animate-bar-grow flex items-center px-3"
                    style={{
                      width: `${Math.max(barWidth, 2)}%`,
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {votedFor && !revealed && (
        <p className="text-center text-sm text-success animate-fade-in">
          Your vote has been cast! Waiting for results to be revealed...
        </p>
      )}

      {/* Countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="text-center py-4 animate-bounce-in">
          <div className="text-6xl font-bold text-accent">{countdown}</div>
          <p className="text-muted text-sm mt-2">Revealing results...</p>
        </div>
      )}

      {/* Host controls */}
      {isHost && !revealed && countdown === null && (
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={startCountdown}
            className="btn-primary text-lg px-8 py-4 animate-pulse-glow"
          >
            Reveal Vote Results {allVoted ? "(All votes in!)" : ""}
          </button>
        </div>
      )}

      {isHost && revealed && (
        <div className="text-center pt-4">
          <button type="button" onClick={onFinish} className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
            Reveal CEO Verdict
          </button>
        </div>
      )}
    </div>
  );
}
