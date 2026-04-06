import { describe, it, expect } from "vitest";
import type { GameSession, Team, Vote, Player, GameStatus } from "@/lib/database.types";

describe("database types", () => {
  it("GameSession has correct shape", () => {
    const session: GameSession = {
      id: "test-id",
      code: "ABC123",
      status: "lobby",
      created_at: "2024-01-01T00:00:00Z",
      host_id: "host-id",
    };
    expect(session.status).toBe("lobby");
    expect(session.code).toBe("ABC123");
  });

  it("GameStatus includes all valid states", () => {
    const statuses: GameStatus[] = ["lobby", "planning", "voting", "finished"];
    expect(statuses).toHaveLength(4);
  });

  it("Team has correct shape with nullable strategy fields", () => {
    const team: Team = {
      id: "team-id",
      session_id: "session-id",
      name: "Squad Rx",
      members: ["player-1", "player-2"],
      problem_statement: null,
      outcome_metric: null,
      mas_pattern: null,
      job_to_be_done: null,
      ai_score: null,
      ai_critique: null,
      ceo_funded: false,
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(team.problem_statement).toBeNull();
    expect(team.ceo_funded).toBe(false);
  });

  it("Vote has correct shape", () => {
    const vote: Vote = {
      id: "vote-id",
      team_id: "team-id",
      voter_id: "voter-id",
      session_id: "session-id",
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(vote.team_id).toBe("team-id");
  });

  it("Player has correct shape", () => {
    const player: Player = {
      id: "player-id",
      session_id: "session-id",
      name: "Alice",
      team_id: null,
      is_host: false,
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(player.name).toBe("Alice");
    expect(player.is_host).toBe(false);
  });

  it("Team mas_pattern accepts valid pattern keys", () => {
    const team: Team = {
      id: "t1",
      session_id: "s1",
      name: "Test",
      members: [],
      problem_statement: "test",
      outcome_metric: "test",
      mas_pattern: "sequential",
      job_to_be_done: "test",
      ai_score: 8,
      ai_critique: "Good",
      ceo_funded: true,
      created_at: "2024-01-01T00:00:00Z",
    };
    expect(["sequential", "parallel", "coordinator"]).toContain(team.mas_pattern);
  });
});
