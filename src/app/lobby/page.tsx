"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { generatePlayerId } from "@/lib/game-utils";
import { isTestMode } from "@/lib/test-mode";
import TestModePanel from "@/components/TestModePanel";
import type { Player, GameSession } from "@/lib/database.types";

const WARMUP_QUESTIONS = [
  {
    question: "A pharmacy needs to check drug-drug, drug-disease, and drug-allergy interactions simultaneously. Which MAS pattern fits best?",
    options: ["Sequential Pipeline", "Parallel Fan-Out", "Coordinator"],
    answer: 1,
    explanation: "Parallel Fan-Out lets multiple sub-agents work independently on each interaction type, then a synthesizer aggregates results \u2014 much faster than checking sequentially.",
  },
  {
    question: "What does the 'M' in the IMPACT framework stand for?",
    options: ["Measurable", "Meaningful", "Minimal"],
    answer: 1,
    explanation: "Meaningful \u2014 does the strategy drive real business value like Star Ratings, adherence improvements, or revenue?",
  },
  {
    question: "A patient support bot needs to route billing questions vs. clinical medication questions to different specialists. Which pattern?",
    options: ["Sequential Pipeline", "Parallel Fan-Out", "Coordinator / Dispatcher"],
    answer: 2,
    explanation: "A Coordinator routes incoming requests to the right specialized sub-agent based on the type of question.",
  },
];

export default function LobbyPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted">Loading lobby...</span>
        </div>
      </main>
    }>
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const code = searchParams.get("code");

  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testMode] = useState(() => isTestMode());
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";

  const quiz = WARMUP_QUESTIONS[quizIndex % WARMUP_QUESTIONS.length];

  const fetchData = useCallback(async () => {
    if (!sessionId) return;

    const [sessionRes, playersRes] = await Promise.all([
      supabase.from("game_sessions").select().eq("id", sessionId).single(),
      supabase.from("players").select().eq("session_id", sessionId),
    ]);

    if (sessionRes.data) {
      setSession(sessionRes.data);
      setIsHost(sessionRes.data.host_id === playerId);
    }
    if (playersRes.data) {
      setPlayers(playersRes.data);
    }
  }, [sessionId, playerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`lobby-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `session_id=eq.${sessionId}` },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === "planning") {
            router.push(`/game/${sessionId}${testMode ? "?test=true" : ""}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchData, router, testMode]);

  useEffect(() => {
    if (session && session.status !== "lobby") {
      router.push(`/game/${sessionId}${testMode ? "?test=true" : ""}`);
    }
  }, [session, sessionId, router, testMode]);

  async function startGame() {
    if (!sessionId) return;
    await supabase
      .from("game_sessions")
      .update({ status: "planning" })
      .eq("id", sessionId);
    // Navigate directly for the host instead of waiting for realtime
    router.push(`/game/${sessionId}${testMode ? "?test=true" : ""}`);
  }

  function copyCode() {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleQuizAnswer(index: number) {
    setSelectedAnswer(index);
    setShowExplanation(true);
  }

  function nextQuestion() {
    setQuizIndex((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }

  if (!sessionId) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">Invalid session. Please go back and try again.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold">Game Lobby</h1>
          <p className="text-muted">Waiting for players to join...</p>
        </div>

        {/* Room Code */}
        <div className="glass-card p-6 text-center space-y-3 animate-slide-up">
          <p className="text-sm text-muted uppercase tracking-wider">Room Code</p>
          <button
            type="button"
            onClick={copyCode}
            className="inline-block font-mono text-5xl font-bold tracking-[0.3em] text-accent hover:text-accent/80 transition-colors cursor-pointer"
          >
            {code}
          </button>
          <p className="text-sm text-muted">
            {copied ? "Copied!" : "Click to copy"}
          </p>
        </div>

        {/* Players */}
        <div className="glass-card p-5 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Players ({players.length})
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-success">Live</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-light/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-sm font-bold text-primary-light">
                  {player.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{player.name}</p>
                  {player.is_host && (
                    <p className="text-xs text-accent">Host</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {players.length === 0 && (
            <p className="text-center text-muted py-4">
              No players yet. Share the room code!
            </p>
          )}
        </div>

        {/* Warmup Quiz */}
        <div className="glass-card p-5 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/images/lobby-lounge.png" alt="" width={32} height={32} className="rounded-lg" style={{ width: 32, height: 'auto' }} />
              <h3 className="text-sm font-semibold text-secondary">Warmup Challenge</h3>
            </div>
            <span className="text-xs text-muted">Q{(quizIndex % WARMUP_QUESTIONS.length) + 1}/{WARMUP_QUESTIONS.length}</span>
          </div>
          <p className="text-sm font-medium">{quiz.question}</p>
          <div className="space-y-2">
            {quiz.options.map((option, i) => {
              let style = "border-border bg-surface-light/30 hover:border-muted";
              if (selectedAnswer !== null) {
                if (i === quiz.answer) style = "border-success bg-success/10";
                else if (i === selectedAnswer) style = "border-danger bg-danger/10";
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => !showExplanation && handleQuizAnswer(i)}
                  disabled={showExplanation}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {showExplanation && (
            <div className="space-y-2 animate-fade-in">
              <div className="learning-callout">
                <p className="text-sm text-foreground/90">{quiz.explanation}</p>
              </div>
              <button
                type="button"
                onClick={nextQuestion}
                className="btn-secondary text-xs w-full"
              >
                Next Question
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {isHost ? (
            <button
              type="button"
              onClick={startGame}
              disabled={players.length < 1}
              className="btn-primary text-lg px-8 py-4 animate-pulse-glow"
            >
              Start Game ({players.length} players)
            </button>
          ) : (
            <div className="glass-card px-6 py-4 text-center">
              <p className="text-muted">
                Waiting for the host to start the game...
              </p>
            </div>
          )}
        </div>

        <p className="text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-muted text-sm hover:text-foreground transition-colors"
          >
            Leave Lobby
          </button>
        </p>
      </div>

      {testMode && sessionId && (
        <TestModePanel sessionId={sessionId} phase="lobby" onAction={fetchData} />
      )}
    </main>
  );
}
