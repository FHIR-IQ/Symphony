"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";

interface Award {
  team: string;
  award: string;
  reason: string;
}

interface VerdictData {
  funded_team: string;
  weighted_scores: Record<string, number>;
  speech: string;
  runner_up: string;
  runner_up_comment: string;
  awards: Award[];
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
          weighted_scores: {},
          speech: "After careful review, this team demonstrated the strongest impact-first thinking.",
          runner_up: teams[1]?.name || "Unknown",
          runner_up_comment: "A close second with impressive strategic vision.",
          awards: [],
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
        <Image src="/images/ceo-avatar.png" alt="CEO" width={80} height={80} className="mx-auto rounded-full animate-pulse w-auto h-auto" />
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
        <Image src="/images/trophy.png" alt="Trophy" width={100} height={100} className="mx-auto rounded-2xl animate-pulse w-auto h-auto" />
        <h2 className="text-3xl font-bold">The Verdict is Ready</h2>
        <p className="text-muted text-lg">
          The CEO has made their decision. Are you ready?
        </p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="btn-primary text-xl px-12 py-5 animate-pulse-glow"
          data-testid="reveal-winner"
        >
          Reveal the Winner
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Winner Announcement */}
      <div className="text-center space-y-4 animate-bounce-in">
        <Image src="/images/trophy.png" alt="Trophy" width={140} height={140} className="mx-auto rounded-2xl w-auto h-auto" />
        <div className="inline-block px-6 py-2 rounded-full bg-accent/20 text-accent text-sm font-bold uppercase tracking-widest">
          Fully Funded
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-accent via-primary-light to-secondary bg-clip-text text-transparent">
          {verdict.funded_team}
        </h2>
      </div>

      {/* CEO Speech */}
      <div className="glass-card p-8 space-y-4 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <Image src="/images/ceo-avatar.png" alt="CEO" width={48} height={48} className="rounded-full w-auto h-auto" />
          <div>
            <p className="font-bold">CEO, Outcomes.com</p>
            <p className="text-xs text-muted">Final Verdict</p>
          </div>
        </div>
        <blockquote className="text-lg leading-relaxed italic text-foreground/90 border-l-4 border-primary pl-4">
          &ldquo;{verdict.speech}&rdquo;
        </blockquote>
      </div>

      {/* Score Breakdown */}
      {Object.keys(verdict.weighted_scores).length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Score Breakdown</h3>
          <p className="text-xs text-muted">AI Impact Score (40%) + Peer Votes (60%)</p>
          <div className="space-y-2">
            {Object.entries(verdict.weighted_scores)
              .sort(([, a], [, b]) => b - a)
              .map(([team, score], index) => (
                <div key={team} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted w-5">{index + 1}.</span>
                    <span className={`text-sm font-semibold ${team === verdict.funded_team ? "text-accent" : ""}`}>
                      {team}
                    </span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${team === verdict.funded_team ? "text-accent" : "text-muted"}`}>
                    {typeof score === "number" ? score.toFixed(1) : score}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

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

      {/* Category Awards */}
      {verdict.awards && verdict.awards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-center text-sm font-semibold text-muted uppercase tracking-wider">Category Awards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
            {verdict.awards.map((award, i) => (
              <div key={i} className="glass-card p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Image src="/images/award-medal.png" alt="" width={24} height={24} className="rounded w-auto h-auto" />
                  <span className="text-sm font-bold text-accent">{award.award}</span>
                </div>
                <p className="text-sm font-semibold">{award.team}</p>
                <p className="text-xs text-muted">{award.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closing */}
      <div className="text-center p-6 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <p className="text-lg font-medium text-foreground/90">
          {verdict.closing}
        </p>
      </div>

      {/* Learning Takeaway */}
      <div className="learning-callout animate-slide-up">
        <div className="text-sm space-y-2">
          <p className="font-semibold">What did we learn?</p>
          <ul className="space-y-1 text-foreground/80">
            <li>&bull; Great strategies start with <strong>specific, quantified problems</strong> &mdash; not features.</li>
            <li>&bull; Outcomes are <strong>behavioral changes</strong> you can measure, not deliverables.</li>
            <li>&bull; The right <strong>MAS architecture</strong> depends on whether your problem is sequential, parallelizable, or needs routing.</li>
            <li>&bull; Peer feedback is just as valuable as AI scoring &mdash; <strong>both perspectives matter</strong>.</li>
          </ul>
        </div>
      </div>

      {/* AI Knowledge Recap */}
      <div className="glass-card p-5 space-y-3 animate-slide-up">
        <p className="text-sm font-semibold text-secondary uppercase tracking-wider">AI Terms Every PM Should Know</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">MCP (Model Context Protocol)</p>
            <p className="text-xs text-foreground/70">The &quot;USB-C for AI&quot; &mdash; one universal standard for connecting AI to tools, adopted across Anthropic, OpenAI, and Google.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">A2A (Agent-to-Agent)</p>
            <p className="text-xs text-foreground/70">Google&apos;s protocol for AI agents to discover each other and collaborate &mdash; the Bluetooth of AI.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">RAG (Retrieval Augmented Generation)</p>
            <p className="text-xs text-foreground/70">An open-book exam for AI &mdash; retrieve relevant docs first, then generate grounded answers.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">Guardrails &amp; Evals</p>
            <p className="text-xs text-foreground/70">Bowling bumpers + report cards for AI. Define what &quot;good&quot; looks like and test before you ship.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">Prompt Injection</p>
            <p className="text-xs text-foreground/70">SQL injection for AI &mdash; malicious inputs that override instructions. Every AI feature needs defenses.</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-light/50 space-y-1">
            <p className="text-xs font-bold text-accent">Human-in-the-Loop (HITL)</p>
            <p className="text-xs text-foreground/70">Autopilot for AI &mdash; the system works autonomously but pauses at critical decision points for human review.</p>
          </div>
        </div>
      </div>

      {/* Session info */}
      <p className="text-center text-xs text-muted">
        Impact Engine Session &middot; {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
