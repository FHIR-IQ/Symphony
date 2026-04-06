"use client";

import { useState } from "react";
import {
  addFakePlayers,
  createFakeTeams,
  fillFakeStrategies,
  simulateFakeVotes,
} from "@/lib/test-mode";

interface Props {
  sessionId: string;
  phase: "lobby" | "teams" | "strategy" | "voting" | "finished";
  onAction?: () => void;
}

export default function TestModePanel({ sessionId, phase, onAction }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<void>) {
    setLoading(label);
    try {
      await fn();
      onAction?.();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <details className="glass-card border-accent/50">
        <summary className="px-4 py-2 cursor-pointer text-xs font-bold text-accent uppercase tracking-wider">
          Test Mode
        </summary>
        <div className="p-3 space-y-2 min-w-[200px]">
          {(phase === "lobby" || phase === "teams") && (
            <>
              <button
                type="button"
                onClick={() => run("players", () => addFakePlayers(sessionId, 6))}
                disabled={loading !== null}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-light hover:bg-border transition-colors disabled:opacity-50"
              >
                {loading === "players" ? "Adding..." : "+ Add 6 Fake Players"}
              </button>
              <button
                type="button"
                onClick={() => run("players3", () => addFakePlayers(sessionId, 3))}
                disabled={loading !== null}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-light hover:bg-border transition-colors disabled:opacity-50"
              >
                {loading === "players3" ? "Adding..." : "+ Add 3 Fake Players"}
              </button>
            </>
          )}

          {(phase === "lobby" || phase === "teams") && (
            <button
              type="button"
              onClick={() => run("teams", () => createFakeTeams(sessionId))}
              disabled={loading !== null}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-light hover:bg-border transition-colors disabled:opacity-50"
            >
              {loading === "teams" ? "Creating..." : "+ Auto-Create Teams"}
            </button>
          )}

          {phase === "strategy" && (
            <button
              type="button"
              onClick={() => run("strategies", () => fillFakeStrategies(sessionId))}
              disabled={loading !== null}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-light hover:bg-border transition-colors disabled:opacity-50"
            >
              {loading === "strategies" ? "Filling..." : "+ Fill All Strategies"}
            </button>
          )}

          {phase === "voting" && (
            <button
              type="button"
              onClick={() => run("votes", () => simulateFakeVotes(sessionId))}
              disabled={loading !== null}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-light hover:bg-border transition-colors disabled:opacity-50"
            >
              {loading === "votes" ? "Voting..." : "+ Simulate All Votes"}
            </button>
          )}

          {phase === "finished" && (
            <p className="text-xs text-muted px-3 py-2">Game complete!</p>
          )}

          <div className="border-t border-border pt-2 mt-2">
            <p className="text-[10px] text-muted px-3">
              Test mode is active (?test in URL)
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
