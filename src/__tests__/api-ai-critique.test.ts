import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI SDK before importing the route
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-model"),
}));

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { POST } from "@/app/api/ai-critique/route";
import { generateText } from "ai";
import { NextRequest } from "next/server";

const mockGenerateText = vi.mocked(generateText);

function makeRequest(body: Record<string, string>) {
  return new NextRequest("http://localhost:3000/api/ai-critique", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/ai-critique", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns AI critique with score and feedback", async () => {
    const mockResult = {
      score: 8,
      grade: "A-",
      strengths: ["Strong problem identification", "Clear metrics"],
      weaknesses: ["Needs more detail on implementation"],
      critique: "A well-thought-out strategy with strong clinical grounding.",
      recommendation: "Flesh out the implementation timeline.",
    };

    mockGenerateText.mockResolvedValue({
      text: JSON.stringify(mockResult),
    } as never);

    const request = makeRequest({
      problemStatement: "Pharmacists spend too much time on refills",
      outcomeMetric: "Reduce refill time by 50%",
      masPattern: "Sequential Pipeline",
      jobToBeDone: "When I am verifying refills, I want to automate routine checks",
      teamName: "Squad Rx",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(8);
    expect(data.grade).toBe("A-");
    expect(data.strengths).toHaveLength(2);
    expect(data.weaknesses).toHaveLength(1);
    expect(data.critique).toBeTruthy();
    expect(data.recommendation).toBeTruthy();
  });

  it("returns fallback response on error", async () => {
    mockGenerateText.mockRejectedValue(new Error("API error"));

    const request = makeRequest({
      problemStatement: "test",
      outcomeMetric: "test",
      masPattern: "test",
      jobToBeDone: "test",
      teamName: "test",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.score).toBe(5);
    expect(data.grade).toBe("C");
    expect(data.strengths).toBeDefined();
    expect(data.weaknesses).toBeDefined();
  });

  it("passes correct parameters to generateText", async () => {
    mockGenerateText.mockResolvedValue({
      text: JSON.stringify({ score: 7, grade: "B", strengths: [], weaknesses: [], critique: "", recommendation: "" }),
    } as never);

    const request = makeRequest({
      problemStatement: "My problem",
      outcomeMetric: "My metric",
      masPattern: "Parallel Fan-Out",
      jobToBeDone: "My JTBD",
      teamName: "Alpha",
    });

    await POST(request);

    expect(mockGenerateText).toHaveBeenCalledOnce();
    const callArgs = mockGenerateText.mock.calls[0][0];
    expect(callArgs.prompt).toContain("My problem");
    expect(callArgs.prompt).toContain("My metric");
    expect(callArgs.prompt).toContain("Parallel Fan-Out");
    expect(callArgs.prompt).toContain("My JTBD");
    expect(callArgs.prompt).toContain("Alpha");
    expect(callArgs.system).toContain("IMPACT");
  });
});
