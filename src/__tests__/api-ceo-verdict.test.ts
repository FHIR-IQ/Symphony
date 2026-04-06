import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(() => "mock-model"),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { POST } from "@/app/api/ceo-verdict/route";
import { generateText } from "ai";
import { NextRequest } from "next/server";

const mockGenerateText = vi.mocked(generateText);

const sampleTeams = [
  {
    name: "Squad Rx",
    problem_statement: "Pharmacist burnout from manual refills",
    outcome_metric: "Reduce refill time by 50%",
    mas_pattern: "sequential",
    ai_score: 8,
    vote_count: 5,
  },
  {
    name: "Team Adherence",
    problem_statement: "Low medication adherence rates",
    outcome_metric: "Improve PDC by 15%",
    mas_pattern: "parallel",
    ai_score: 7,
    vote_count: 3,
  },
];

function makeRequest(teams: typeof sampleTeams) {
  return new NextRequest("http://localhost:3000/api/ceo-verdict", {
    method: "POST",
    body: JSON.stringify({ teams }),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/ceo-verdict", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns CEO verdict with funded team, speech, awards, and weighted scores", async () => {
    const mockVerdict = {
      funded_team: "Squad Rx",
      weighted_scores: { "Squad Rx": 6.2, "Team Adherence": 4.6 },
      speech: "I'm thrilled to announce full funding for Squad Rx!",
      runner_up: "Team Adherence",
      runner_up_comment: "A close second with strong potential.",
      awards: [
        { team: "Squad Rx", award: "Most Ambitious Vision", reason: "Bold approach to refill automation." },
        { team: "Team Adherence", award: "Best Problem Discovery", reason: "Clear identification of adherence gaps." },
      ],
      closing: "The future of pharmacy is AI-powered!",
    };

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify(mockVerdict),
    } as never);

    const response = await POST(makeRequest(sampleTeams));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funded_team).toBe("Squad Rx");
    expect(data.speech).toBeTruthy();
    expect(data.runner_up).toBe("Team Adherence");
    expect(data.closing).toBeTruthy();
    expect(data.weighted_scores).toEqual({ "Squad Rx": 6.2, "Team Adherence": 4.6 });
    expect(data.awards).toHaveLength(2);
    expect(data.awards[0].award).toBe("Most Ambitious Vision");
  });

  it("returns fallback with awards array on error", async () => {
    mockGenerateText.mockRejectedValue(new Error("API error"));

    const response = await POST(makeRequest(sampleTeams));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funded_team).toBeDefined();
    expect(data.speech).toBeTruthy();
    expect(data.runner_up).toBeDefined();
    expect(data.closing).toBeTruthy();
    expect(data.weighted_scores).toBeDefined();
    expect(data.awards).toBeDefined();
    expect(Array.isArray(data.awards)).toBe(true);
  });

  it("includes team data in the prompt", async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({
        funded_team: "Squad Rx",
        weighted_scores: {},
        speech: "Great!",
        runner_up: "Team Adherence",
        runner_up_comment: "Good effort.",
        awards: [],
        closing: "Onward!",
      }),
    } as never);

    await POST(makeRequest(sampleTeams));

    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("Squad Rx");
    expect(callArgs.prompt).toContain("Team Adherence");
    expect(callArgs.prompt).toContain("8");
    expect(callArgs.prompt).toContain("5");
    expect(callArgs.system).toContain("CEO");
    expect(callArgs.system).toContain("40%");
    expect(callArgs.prompt).toContain("weighted score");
  });
});
