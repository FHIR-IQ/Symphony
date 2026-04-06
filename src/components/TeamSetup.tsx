"use client";

import { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { generatePlayerId } from "@/lib/game-utils";
import type { Player, Team } from "@/lib/database.types";

interface Props {
  sessionId: string;
  players: Player[];
  teams: Team[];
  isHost: boolean;
  onTeamsReady: () => void;
  onDataChanged?: () => Promise<void> | void;
}

export default function TeamSetup({ sessionId, players, teams, isHost, onTeamsReady, onDataChanged }: Props) {
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";

  const myPlayer = players.find((p) => p.id === playerId);
  const myTeam = teams.find((t) => myPlayer?.team_id === t.id);

  async function createTeam() {
    if (!newTeamName.trim()) return;
    setCreating(true);
    setError("");

    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          session_id: sessionId,
          name: newTeamName.trim(),
          members: [playerId],
        })
        .select()
        .single();

      if (teamError || !team) {
        setError(`Failed to create team: ${teamError?.message || "Unknown error"}`);
        return;
      }

      const { error: playerError } = await supabase
        .from("players")
        .update({ team_id: team.id })
        .eq("id", playerId);

      if (playerError) {
        setError(`Failed to assign to team: ${playerError.message}`);
        return;
      }

      setNewTeamName("");
    } finally {
      setCreating(false);
    }

    await onDataChanged?.();
  }

  async function joinTeam(teamId: string) {
    if (joining) return;
    setJoining(true);
    setError("");

    try {
      const team = teams.find((t) => t.id === teamId);
      if (!team) {
        setError("Team not found");
        return;
      }

      // Update team members array
      const updatedMembers = [...(team.members || []), playerId];
      const { error: membersError } = await supabase
        .from("teams")
        .update({ members: updatedMembers })
        .eq("id", teamId);

      if (membersError) {
        setError(`Failed to update team: ${membersError.message}`);
        return;
      }

      // Update player's team_id
      const { error: playerError } = await supabase
        .from("players")
        .update({ team_id: teamId })
        .eq("id", playerId);

      if (playerError) {
        setError(`Failed to join team: ${playerError.message}`);
        return;
      }
    } finally {
      setJoining(false);
    }

    await onDataChanged?.();
  }

  const allPlayersOnTeams = players.every((p) => p.team_id);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <Image src="/images/team-huddle.png" alt="" width={120} height={120} className="mx-auto animate-bounce-in rounded-2xl w-auto h-auto" />
        <h2 className="text-2xl font-bold">Form Your Squads</h2>
        <p className="text-muted text-sm">
          Create or join a team of 3-4 product managers
        </p>
      </div>

      {error && (
        <div className="glass-card p-3 border-danger/50">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* My Status */}
      {myTeam ? (
        <div className="glass-card p-4 border-primary/50">
          <p className="text-sm text-success font-medium">
            You&apos;re on team: <span className="text-primary-light font-bold">{myTeam.name}</span>
          </p>
        </div>
      ) : (
        <>
          {/* Create Team */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-sm">Create a New Team</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name (e.g. Squad Rx)"
                className="input-field flex-1"
                maxLength={30}
              />
              <button
                onClick={createTeam}
                disabled={!newTeamName.trim() || creating}
                className="btn-primary"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Existing Teams */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-muted">
          Teams ({teams.length})
        </h3>
        <div className="learning-callout">
          <p className="text-xs text-foreground/80">
            Teams of <strong>3&ndash;4</strong> collaborate best. Mix different perspectives &mdash; pair a data thinker with a clinical expert for stronger strategies.
          </p>
        </div>
        {teams.map((team) => {
          const teamPlayers = players.filter((p) => p.team_id === team.id);
          return (
            <div
              key={team.id}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{team.name}</p>
                <p className="text-xs text-muted">
                  {teamPlayers.map((p) => p.name).join(", ") || "No members yet"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {teamPlayers.length}/4
                </span>
                {!myTeam && teamPlayers.length < 4 && (
                  <button
                    onClick={() => joinTeam(team.id)}
                    disabled={joining}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    {joining ? "Joining..." : "Join"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && (
          <p className="text-center text-muted py-4">
            No teams yet. Create one to get started!
          </p>
        )}
      </div>

      {/* Host: Proceed */}
      {isHost && teams.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={onTeamsReady}
            disabled={teams.length < 1}
            className="btn-primary px-8"
            data-testid="begin-strategy"
          >
            {allPlayersOnTeams
              ? "Begin Strategy Phase"
              : `Begin Strategy Phase (${teams.length} teams)`}
          </button>
        </div>
      )}
    </div>
  );
}
