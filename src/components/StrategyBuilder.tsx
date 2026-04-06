"use client";

import { useState } from "react";
import { MAS_PATTERNS, type MASPatternKey } from "@/lib/game-utils";
import { supabase } from "@/lib/supabase";

interface Props {
  teamId: string;
  teamName: string;
  onSubmitted: () => void;
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
      // Get AI critique
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

      // Save to Supabase
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

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s <= step
                  ? "bg-primary text-white"
                  : "bg-surface-light text-muted"
              }`}
            >
              {s < step ? "\u2713" : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 h-0.5 ${
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
          <p className="text-muted text-sm">
            Identify the critical pain point in pharmacy operations that your
            team will solve. Think about the 48,000 pharmacies, 200+ daily
            prescriptions per pharmacist, and 50%+ burnout rate.
          </p>
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
            <p className="text-xs text-muted text-right">
              {problemStatement.length}/500
            </p>
          </div>
          <button
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
          <p className="text-muted text-sm">
            Define the measurable behavioral change your solution will create.
            Remember: outcomes are about changing behavior, not shipping features.
          </p>
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
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
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
          <h3 className="text-xl font-bold">Step 3: Agentic Strategy</h3>
          <p className="text-muted text-sm">
            Choose the multi-agent system pattern that best fits your clinical
            problem. Explain why this architecture is superior for your use case.
          </p>
          <div className="space-y-3">
            {(Object.entries(MAS_PATTERNS) as [MASPatternKey, typeof MAS_PATTERNS[MASPatternKey]][]).map(
              ([key, pattern]) => (
                <button
                  key={key}
                  onClick={() => setMasPattern(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    masPattern === key
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface-light/30 hover:border-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-mono text-primary-light">
                      {pattern.icon}
                    </span>
                    <div>
                      <p className="font-semibold">{pattern.name}</p>
                      <p className="text-sm text-muted">{pattern.description}</p>
                      <p className="text-xs text-secondary mt-1">
                        Example: {pattern.example}
                      </p>
                    </div>
                  </div>
                </button>
              )
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
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

          {/* Score */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-4">
              <div className="text-6xl font-bold text-primary-light">
                {aiResult.score}
              </div>
              <div className="text-left">
                <div className="text-3xl font-bold text-accent">
                  {aiResult.grade}
                </div>
                <div className="text-sm text-muted">Impact Score</div>
              </div>
            </div>
          </div>

          {/* Critique */}
          <div className="p-4 rounded-xl bg-surface-light/50 space-y-3">
            <p className="text-foreground">{aiResult.critique}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-success">Strengths</h4>
              {aiResult.strengths.map((s, i) => (
                <p key={i} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-success">+</span> {s}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-danger">Areas to Improve</h4>
              {aiResult.weaknesses.map((w, i) => (
                <p key={i} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-danger">-</span> {w}
                </p>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-3 rounded-xl border border-accent/30 bg-accent/5">
            <p className="text-sm">
              <span className="font-semibold text-accent">Recommendation:</span>{" "}
              {aiResult.recommendation}
            </p>
          </div>

          <button onClick={onSubmitted} className="btn-primary w-full">
            Ready for Voting Phase
          </button>
        </div>
      )}
    </div>
  );
}
