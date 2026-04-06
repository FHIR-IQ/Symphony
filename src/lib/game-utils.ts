import { v4 as uuidv4 } from "uuid";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("impact-engine-player-id");
    if (stored) return stored;
    const id = uuidv4();
    localStorage.setItem("impact-engine-player-id", id);
    return id;
  }
  return uuidv4();
}

export function getPlayerName(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("impact-engine-player-name");
  }
  return null;
}

export function setPlayerName(name: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("impact-engine-player-name", name);
  }
}

export const MAS_PATTERNS = {
  sequential: {
    name: "Sequential Pipeline",
    description:
      "Linear execution where output from one agent feeds the next.",
    example: "Processing a patient's historical claims to identify adherence gaps.",
    icon: "->",
  },
  parallel: {
    name: "Parallel Fan-Out",
    description:
      "Multiple sub-agents work independently and a synthesizer aggregates results.",
    example:
      "Simultaneously checking drug-drug, drug-disease, and drug-allergy interactions.",
    icon: "||",
  },
  coordinator: {
    name: "Coordinator / Dispatcher",
    description: "A central agent routes requests to specialized sub-agents.",
    example:
      "A patient support bot routing billing issues vs. clinical medication questions.",
    icon: "<>",
  },
} as const;

export type MASPatternKey = keyof typeof MAS_PATTERNS;

export const TEAM_COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];
