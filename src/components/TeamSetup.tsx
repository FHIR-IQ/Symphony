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
  onDataChanged?: () => void;
}

export default function TeamSetup({ sessionId, players, teams, isHost, onTeamsReady, onDataChanged }: Props) {
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";

  const myPlayer = players.find((p) => p.id === playerId);
  const myTeam = teams.find((t) => myPlayer?.team_id === t.id);

  async function createTeam() {
    if (!newTeamName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("teams")
      .insert({
        session_id: sessionId,
        name: newTeamName.trim(),
        members: [playerId],
      })
      .select()
      .single();

    if (data && !error) {
      await supabase
        .from("players")
        .update({ team_id: data.id })
        .eq("id", playerId);
    }

    setNewTeamName("");
    setCreating(false);
    onDataChanged?.();
  }

  async function joinTeam(teamId: string) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = [...(team.members || []), playerId];
    await supabase
      .from("teams")
      .update({ members: updatedMembers })
      .eq("id", teamId);

    await supabase
      .from("players")
      .update({ team_id: teamId })
      .eq("id", playerId);

    onDataChanged?.();
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
                Create
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
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Join
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
