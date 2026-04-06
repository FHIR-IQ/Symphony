import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { problemStatement, outcomeMetric, masPattern, jobToBeDone, teamName } =
      await request.json();

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: `You are a senior healthcare executive and product strategy advisor evaluating product pitches for a pharmacy technology company (Outcomes.com) that operates a network of 48,000 pharmacies.

You evaluate proposals using the IMPACT framework:
- Interesting: Is this compelling to pharmacists and patients?
- Meaningful: Does it drive real business value (Star Ratings, adherence, revenue)?
- People-focused: Does it target the right users with the right urgency?
- Actionable: Can the team actually build and ship this?
- Clear: Is the strategy well-articulated?
- Testable: Can success be measured?

Respond in valid JSON format with this structure:
{
  "score": <number 1-10>,
  "grade": "<letter grade A+ through F>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "critique": "<2-3 sentence overall assessment>",
  "recommendation": "<1 sentence actionable next step>"
}`,
      prompt: `Evaluate this pharmacy product strategy from Team "${teamName}":

**Problem Statement:** ${problemStatement}

**Target Outcome Metric:** ${outcomeMetric}

**Job To Be Done:** ${jobToBeDone}

**Multi-Agent System Pattern:** ${masPattern}

Score this strategy 1-10 using the IMPACT framework. Be constructive but rigorous.`,
    });

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI critique error:", error);
    return NextResponse.json(
      {
        score: 5,
        grade: "C",
        strengths: ["Shows initiative"],
        weaknesses: ["Could not fully evaluate due to an error"],
        critique: "The AI reviewer encountered an issue processing this submission. Please try again.",
        recommendation: "Resubmit your strategy for evaluation.",
      },
      { status: 200 }
    );
  }
}
