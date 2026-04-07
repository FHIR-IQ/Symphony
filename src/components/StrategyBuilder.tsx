"use client";

import { useState } from "react";
import Image from "next/image";
import { MAS_PATTERNS, type MASPatternKey } from "@/lib/game-utils";
import { supabase } from "@/lib/supabase";
import { AI_TERM_SPOTLIGHTS } from "@/lib/ai-knowledge";

interface Props {
  teamId: string;
  teamName: string;
  onSubmitted: () => void;
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 283; // 2 * PI * 45
  const offset = circumference - (score / 10) * circumference;
  const color = score >= 8 ? "var(--success)" : score >= 6 ? "var(--accent)" : score >= 4 ? "var(--primary)" : "var(--danger)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100" className="score-ring">
        <circle cx="50" cy="50" r="45" className="score-ring-bg" />
        <circle
          cx="50" cy="50" r="45"
          className="score-ring-fill"
          style={{ strokeDashoffset: offset, stroke: color }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold animate-bounce-in" style={{ color }}>{score}</span>
        <span className="text-sm font-bold text-accent">{grade}</span>
      </div>
    </div>
  );
}

export default function StrategyBuilder({ teamId, teamName, onSubmitted }: Props) {
  const [step, setStep] = useState(1);
  const [problemStatement, setProblemStatement] = useState("");
  const [outcomeMetric, setOutcomeMetric] = useState("");
  const [jobToBeDone, setJobToBeDone] = useState("");
  const [masPattern, setMasPattern] = useState<MASPatternKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    score: number;
    grade: string;
    strengths: string[];
    weaknesses: string[];
    critique: string;
    recommendation: string;
  } | null>(null);

  async function handleSubmit() {
    if (!masPattern) return;
    setLoading(true);

    try {
      const response = await fetch("/api/ai-critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemStatement,
          outcomeMetric,
          masPattern: MAS_PATTERNS[masPattern].name,
          jobToBeDone,
          teamName,
        }),
      });

      const result = await response.json();
      setAiResult(result);

      await supabase
        .from("teams")
        .update({
          problem_statement: problemStatement,
          outcome_metric: outcomeMetric,
          job_to_be_done: jobToBeDone,
          mas_pattern: masPattern,
          ai_score: result.score,
          ai_critique: result.critique,
        })
        .eq("id", teamId);

      setStep(4);
    } catch {
      setAiResult({
        score: 5,
        grade: "C",
        strengths: ["Submitted on time"],
        weaknesses: ["AI evaluation unavailable"],
        critique: "Could not complete AI evaluation. Your strategy has been saved.",
        recommendation: "Proceed to voting phase.",
      });
      setStep(4);
    } finally {
      setLoading(false);
    }
  }

  const stepLabels = ["Impact Discovery", "Outcome Definition", "Agentic Strategy", "AI Review"];

  // Curated AI term spotlights for each step (by term name)
  const stepSpotlights = [
    AI_TERM_SPOTLIGHTS.find((t) => t.term === "RAG"),
    AI_TERM_SPOTLIGHTS.find((t) => t.term === "Evals"),
    AI_TERM_SPOTLIGHTS.find((t) => t.term === "A2A (Agent-to-Agent)"),
    AI_TERM_SPOTLIGHTS.find((t) => t.term === "Guardrails"),
  ];

  return (
    <div className="space-y-6">
      {/* IMPACT Framework Reference */}
      {step < 4 && (
        <details className="glass-card p-4">
          <summary className="text-sm font-semibold text-primary-light cursor-pointer">
            How your strategy will be scored (IMPACT Framework)
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 stagger-children">
            {[
              { letter: "I", label: "Interesting", desc: "Compelling to pharmacists & patients?" },
              { letter: "M", label: "Meaningful", desc: "Drives real business value?" },
              { letter: "P", label: "People-focused", desc: "Targets the right users with urgency?" },
              { letter: "A", label: "Actionable", desc: "Can the team build & ship this?" },
              { letter: "C", label: "Clear", desc: "Is the strategy well-articulated?" },
              { letter: "T", label: "Testable", desc: "Can success be measured?" },
            ].map((item) => (
              <div key={item.letter} className="p-2 rounded-lg bg-surface-light/50">
                <span className="text-xs font-bold text-accent">{item.letter}</span>
                <span className="text-xs font-semibold ml-1">{item.label}</span>
                <p className="text-xs text-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s <= step
                    ? "bg-primary text-white"
                    : "bg-surface-light text-muted"
                }`}
              >
                {s < step ? "\u2713" : s}
              </div>
              <span className={`text-[10px] ${s === step ? "text-primary-light font-bold" : "text-muted"}`}>
                {stepLabels[s - 1]}
              </span>
            </div>
            {s < 4 && (
              <div
                className={`w-8 h-0.5 mb-4 ${
                  s < step ? "bg-primary" : "bg-surface-light"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Problem Statement */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold">Step 1: Impact Discovery</h3>
          <div className="learning-callout">
            <p className="text-sm">
              Great problem statements are <strong>specific</strong>, <strong>quantified</strong>, and focus on a <strong>real person&apos;s pain</strong>.
              Think about the 48,000 pharmacies, 200+ daily prescriptions per pharmacist, and 50%+ burnout rate.
            </p>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary-light">
              Problem Statement
            </label>
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="e.g., Pharmacists spend 60% of their time on routine refill verification, leaving insufficient time for clinical consultations that improve medication adherence..."
              className="input-field min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {problemStatement.length > 0 && (
                  <div className="flex gap-1 text-xs">
                    <span className={problemStatement.length >= 50 ? "text-success" : "text-muted"}>
                      {problemStatement.length >= 50 ? "\u2713" : "\u25CB"} 50+ chars
                    </span>
                    <span className={/\d/.test(problemStatement) ? "text-success" : "text-muted"}>
                      {/\d/.test(problemStatement) ? "\u2713" : "\u25CB"} Has data
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted">{problemStatement.length}/500</p>
            </div>
          </div>
          {stepSpotlights[0] && (
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">PM Term: {stepSpotlights[0].term}</p>
              <p className="text-xs text-foreground/80">{stepSpotlights[0].definition}</p>
              <p className="text-xs text-accent italic">{stepSpotlights[0].analogy}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!problemStatement.trim()}
            className="btn-primary w-full"
          >
            Next: Define Your Outcome
          </button>
        </div>
      )}

      {/* Step 2: Outcome & JTBD */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold">Step 2: Outcome Definition</h3>
          <div className="learning-callout">
            <p className="text-sm">
              Outcomes are <strong>behavioral changes</strong>, not features. Instead of &quot;build a dashboard&quot;, think &quot;reduce pharmacist lookup time from 5 min to 30 sec.&quot;
              The JTBD framework helps you stay user-centered.
            </p>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary-light">
              Target Outcome Metric
            </label>
            <input
              type="text"
              value={outcomeMetric}
              onChange={(e) => setOutcomeMetric(e.target.value)}
              placeholder="e.g., Reduce average CMR completion time from 45 to 30 minutes"
              className="input-field"
              maxLength={200}
            />
            {outcomeMetric.length > 0 && (
              <div className="flex gap-2 text-xs">
                <span className={/\d/.test(outcomeMetric) ? "text-success" : "text-muted"}>
                  {/\d/.test(outcomeMetric) ? "\u2713" : "\u25CB"} Quantified
                </span>
                <span className={outcomeMetric.length >= 20 ? "text-success" : "text-muted"}>
                  {outcomeMetric.length >= 20 ? "\u2713" : "\u25CB"} Specific
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-primary-light">
              Job To Be Done
            </label>
            <textarea
              value={jobToBeDone}
              onChange={(e) => setJobToBeDone(e.target.value)}
              placeholder="When I am [situation], I want to [motivation], so I can [outcome]..."
              className="input-field min-h-[80px] resize-none"
              maxLength={300}
            />
          </div>
          {stepSpotlights[1] && (
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">PM Term: {stepSpotlights[1].term}</p>
              <p className="text-xs text-foreground/80">{stepSpotlights[1].definition}</p>
              <p className="text-xs text-accent italic">{stepSpotlights[1].analogy}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!outcomeMetric.trim() || !jobToBeDone.trim()}
              className="btn-primary flex-1"
            >
              Next: Design Your Agent System
            </button>
          </div>
        </div>
      )}

      {/* Step 3: MAS Pattern */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <Image src="/images/strategy-brain.png" alt="" width={48} height={48} className="rounded-xl w-auto h-auto" />
            <h3 className="text-xl font-bold">Step 3: Agentic Strategy</h3>
          </div>
          <div className="learning-callout">
            <p className="text-sm">
              Multi-Agent Systems (MAS) use specialized AI agents working together.
              Pick the architecture that matches your problem &mdash; there&apos;s no &quot;best&quot; pattern, only the <strong>right fit</strong> for your use case.
            </p>
          </div>
          <div className="space-y-3 stagger-children">
            {(Object.entries(MAS_PATTERNS) as [MASPatternKey, typeof MAS_PATTERNS[MASPatternKey]][]).map(
              ([key, pattern]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMasPattern(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    masPattern === key
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface-light/30 hover:border-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono text-primary-light w-8 text-center">
                      {pattern.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{pattern.name}</p>
                      <p className="text-sm text-muted">{pattern.description}</p>
                      <p className="text-xs text-secondary mt-1">
                        Example: {pattern.example}
                      </p>
                    </div>
                    {masPattern === key && (
                      <span className="text-primary text-lg">\u2713</span>
                    )}
                  </div>
                </button>
              )
            )}
          </div>
          {stepSpotlights[2] && (
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">PM Term: {stepSpotlights[2].term}</p>
              <p className="text-xs text-foreground/80">{stepSpotlights[2].definition}</p>
              <p className="text-xs text-accent italic">{stepSpotlights[2].analogy}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!masPattern || loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is Evaluating...
                </span>
              ) : (
                "Submit for AI Review"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: AI Result */}
      {step === 4 && aiResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h3 className="text-xl font-bold">AI Strategic Review</h3>
            <p className="text-muted text-sm">
              Your strategy has been evaluated by the IMPACT framework AI
            </p>
          </div>

          {/* Score Ring */}
          <div className="flex justify-center py-4">
            <ScoreRing score={aiResult.score} grade={aiResult.grade} />
          </div>

          {/* Critique */}
          <div className="p-4 rounded-xl bg-surface-light/50 space-y-3">
            <p className="text-foreground">{aiResult.critique}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 space-y-2">
              <h4 className="text-sm font-semibold text-success flex items-center gap-1">
                <span className="text-base">+</span> Strengths
              </h4>
              <div className="stagger-children">
                {aiResult.strengths.map((s, i) => (
                  <p key={i} className="text-sm text-foreground/80 flex items-start gap-2 py-0.5">
                    <span className="text-success shrink-0">\u2713</span> {s}
                  </p>
                ))}
              </div>
            </div>
            <div className="glass-card p-4 space-y-2">
              <h4 className="text-sm font-semibold text-danger flex items-center gap-1">
                <span className="text-base">\u2191</span> Improve
              </h4>
              <div className="stagger-children">
                {aiResult.weaknesses.map((w, i) => (
                  <p key={i} className="text-sm text-foreground/80 flex items-start gap-2 py-0.5">
                    <span className="text-accent shrink-0">\u25B6</span> {w}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="learning-callout">
            <p className="text-sm">
              <span className="font-semibold text-accent">Recommendation:</span>{" "}
              {aiResult.recommendation}
            </p>
          </div>

          {stepSpotlights[3] && (
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">PM Term: {stepSpotlights[3].term}</p>
              <p className="text-xs text-foreground/80">{stepSpotlights[3].definition}</p>
              <p className="text-xs text-accent italic">{stepSpotlights[3].analogy}</p>
            </div>
          )}

          <button type="button" onClick={onSubmitted} className="btn-primary w-full">
            Ready for Voting Phase
          </button>
        </div>
      )}
    </div>
  );
}
