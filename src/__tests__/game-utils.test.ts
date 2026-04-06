import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateRoomCode, generatePlayerId, getPlayerName, setPlayerName, MAS_PATTERNS, TEAM_COLORS } from "@/lib/game-utils";

describe("generateRoomCode", () => {
  it("returns a 6-character string", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it("only contains valid characters (no ambiguous chars like 0, O, 1, I)", () => {
    const validChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(validChars).toContain(char);
      }
    }
  });

  it("generates unique codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateRoomCode()));
    // With 31^6 possible codes, 100 should all be unique
    expect(codes.size).toBe(100);
  });
});

describe("generatePlayerId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a UUID string", () => {
    const id = generatePlayerId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("returns the same ID on subsequent calls (persisted in localStorage)", () => {
    const id1 = generatePlayerId();
    const id2 = generatePlayerId();
    expect(id1).toBe(id2);
  });

  it("stores the ID in localStorage", () => {
    const id = generatePlayerId();
    expect(localStorage.getItem("impact-engine-player-id")).toBe(id);
  });
});

describe("player name helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getPlayerName returns null when no name is set", () => {
    expect(getPlayerName()).toBeNull();
  });

  it("setPlayerName stores and getPlayerName retrieves the name", () => {
    setPlayerName("Alice");
    expect(getPlayerName()).toBe("Alice");
  });
});

describe("MAS_PATTERNS", () => {
  it("has three patterns: sequential, parallel, coordinator", () => {
    expect(Object.keys(MAS_PATTERNS)).toEqual(["sequential", "parallel", "coordinator"]);
  });

  it("each pattern has name, description, example, and icon", () => {
    for (const pattern of Object.values(MAS_PATTERNS)) {
      expect(pattern).toHaveProperty("name");
      expect(pattern).toHaveProperty("description");
      expect(pattern).toHaveProperty("example");
      expect(pattern).toHaveProperty("icon");
      expect(typeof pattern.name).toBe("string");
      expect(typeof pattern.description).toBe("string");
    }
  });
});

describe("TEAM_COLORS", () => {
  it("has 8 colors", () => {
    expect(TEAM_COLORS).toHaveLength(8);
  });

  it("each color is a valid hex string", () => {
    for (const color of TEAM_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
