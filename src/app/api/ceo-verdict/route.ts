import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";

interface TeamData {
  name: string;
  problem_statement: string | null;
  outcome_metric: string | null;
  mas_pattern: string | null;
  ai_score: number | null;
  vote_count: number;
}

export async function POST(request: NextRequest) {
  try {
    const { teams }: { teams: TeamData[] } = await request.json();

    const teamsDescription = teams
      .map(
        (t, i) =>
          `Team ${i + 1}: "${t.name}"
  - Problem: ${t.problem_statement || "Not specified"}
  - Outcome: ${t.outcome_metric || "Not specified"}
  - MAS Pattern: ${t.mas_pattern || "Not specified"}
  - AI Impact Score: ${t.ai_score ?? "N/A"}/10
  - Peer Votes: ${t.vote_count}`
      )
      .join("\n\n");

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: `You are the CEO of Outcomes.com, a pharmacy technology company operating 48,000 pharmacies nationwide. You are making a final funding decision at an internal product innovation competition.

You are charismatic, data-driven, and passionate about improving pharmacy care. You speak with authority but also humor.

The winner is determined by combining the AI Impact Score (40% weight) and Peer Votes (60% weight). Calculate a weighted score for each team to determine the winner. In case of a tie, the team with the higher AI Impact Score wins.

In addition to picking the overall winner, you MUST give out category awards to recognize each team's unique strengths. Every team should receive at least one award.

Respond in valid JSON:
{
  "funded_team": "<team name that gets funded>",
  "weighted_scores": {"<team name>": <number>, ...},
  "speech": "<A 3-4 sentence dramatic CEO speech announcing the winner. Be theatrical and inspiring. Reference specific details from their proposal.>",
  "runner_up": "<runner up team name>",
  "runner_up_comment": "<1 sentence about the runner up>",
  "awards": [
    {"team": "<team name>", "award": "<category award name>", "reason": "<1 sentence why>"},
    ...
  ],
  "closing": "<A motivational 1-sentence closing remark about the future of pharmacy AI>"
}`,
      prompt: `Here are the teams competing in today's "Billion Dollar Pivot" challenge:\n\n${teamsDescription}\n\nCalculate the weighted score for each team (AI Score * 0.4 + Peer Votes * 0.6), pick the winner, and assign category awards. Example award categories: "Best Problem Discovery", "Most Creative Architecture", "Clearest Outcome Metric", "Most Ambitious Vision", "Best Use of AI Agents". Every team must receive at least one award.`,
    });

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("CEO verdict error:", error);
    return NextResponse.json({
      funded_team: "Team Alpha",
      weighted_scores: {},
      speech:
        "After careful consideration, I'm excited to fully fund this initiative. The potential for transforming pharmacy care is immense.",
      runner_up: "Team Beta",
      runner_up_comment: "A strong contender with promising ideas.",
      awards: [],
      closing:
        "The future of pharmacy is AI-augmented, human-centered, and impact-driven.",
    });
  }
}
