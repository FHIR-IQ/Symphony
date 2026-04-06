import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockUpsert = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ upsert: mockUpsert })),
  })),
}));

import { POST } from "@/app/api/vote/route";

function makeRequest(body: Record<string, string | undefined>) {
  return new NextRequest("http://localhost:3000/api/vote", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/vote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("casts a vote successfully", async () => {
    const request = makeRequest({
      teamId: "team-1",
      voterId: "voter-1",
      sessionId: "session-1",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 400 for missing fields", async () => {
    const request = makeRequest({ teamId: "team-1" });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing");
  });

  it("returns 500 on database error", async () => {
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });

    const request = makeRequest({
      teamId: "team-1",
      voterId: "voter-1",
      sessionId: "session-1",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
