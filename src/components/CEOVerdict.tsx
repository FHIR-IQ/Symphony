"use client";

import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

interface VerdictData {
  funded_team: string;
  speech: string;
  runner_up: string;
  runner_up_comment: string;
  closing: string;
}

interface Props {
  sessionId: string;
  teams: { name: string; problem_statement: string | null; outcome_metric: string | null; mas_pattern: string | null; ai_score: number | null; vote_count: number }[];
}

export default function CEOVerdict({ sessionId, teams }: Props) {
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchVerdict() {
      try {
        const response = await fetch("/api/ceo-verdict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teams }),
        });
        const data = await response.json();
        setVerdict(data);
      } catch {
        setVerdict({
          funded_team: teams[0]?.name || "Unknown",
          speech: "After careful review, this team demonstrated the strongest impact-first thinking.",
          runner_up: teams[1]?.name || "Unknown",
          runner_up_comment: "A close second with impressive strategic vision.",
          closing: "The future of pharmacy AI starts today!",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchVerdict();
  }, [teams]);

  useEffect(() => {
    if (revealed && verdict) {
      // Fire confetti
      const duration = 4000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#7c3aed", "#06b6d4", "#f59e0b", "#10b981"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [revealed, verdict]);

  if (loading) {
    return (
      <div className="text-center space-y-6 py-12 animate-fade-in">
        <div className="text-6xl">&#129302;</div>
        <h2 className="text-2xl font-bold">The CEO is deliberating...</h2>
        <p className="text-muted">
          Analyzing strategies, weighing impact scores, and preparing the final verdict.
        </p>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!verdict) return null;

  if (!revealed) {
    return (
      <div className="text-center space-y-6 py-12 animate-fade-in">
        <div className="text-6xl">&#127942;</div>
        <h2 className="text-3xl font-bold">The Verdict is Ready</h2>
        <p className="text-muted text-lg">
          The CEO has made their decision. Are you ready?
        </p>
        <button
          onClick={() => setRevealed(true)}
          className="btn-primary text-xl px-12 py-5 animate-pulse-glow"
        >
          Reveal the Winner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 animate-fade-in">
      {/* Winner Announcement */}
      <div className="text-center space-y-4">
        <div className="text-6xl">&#127942;</div>
        <div className="inline-block px-6 py-2 rounded-full bg-accent/20 text-accent text-sm font-bold uppercase tracking-widest">
          Fully Funded
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-accent via-primary-light to-secondary bg-clip-text text-transparent">
          {verdict.funded_team}
        </h2>
      </div>

      {/* CEO Speech */}
      <div className="glass-card p-8 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center text-xl">
            &#128100;
          </div>
          <div>
            <p className="font-bold">CEO, Outcomes.com</p>
            <p className="text-xs text-muted">Final Verdict</p>
          </div>
        </div>
        <blockquote className="text-lg leading-relaxed italic text-foreground/90 border-l-4 border-primary pl-4">
          &ldquo;{verdict.speech}&rdquo;
        </blockquote>
      </div>

      {/* Runner Up */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#129352;</span>
          <div>
            <p className="font-semibold">Runner Up: {verdict.runner_up}</p>
            <p className="text-sm text-muted">{verdict.runner_up_comment}</p>
          </div>
        </div>
      </div>

      {/* Closing */}
      <div className="text-center p-6 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <p className="text-lg font-medium text-foreground/90">
          {verdict.closing}
        </p>
      </div>

      {/* Session info */}
      <p className="text-center text-xs text-muted">
        Impact Engine Session &middot; {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
