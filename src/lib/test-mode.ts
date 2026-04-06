import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase";

const FAKE_NAMES = [
  "Dr. Patel", "Sarah Chen", "Marcus Johnson", "Aisha Williams",
  "James Rodriguez", "Priya Sharma", "David Kim", "Olivia Brown",
  "Tyler Nguyen", "Emma Garcia", "Raj Malhotra", "Lisa Park",
];

const FAKE_PROBLEMS = [
  "Pharmacists waste 40% of their day on prior authorization calls, reducing time for patient counseling and increasing burnout across 48,000 pharmacies.",
  "Medication adherence drops 35% after the first 90 days, costing payers $290B annually. Pharmacists lack tools to intervene at the right moment.",
  "Drug-drug interaction alerts fire on 85% of prescriptions, causing alert fatigue. Pharmacists override 90% of warnings, risking patient safety.",
  "Rural pharmacies process 30% fewer clinical services than urban ones due to limited staffing, widening health outcome disparities.",
];

const FAKE_OUTCOMES = [
  "Reduce prior auth processing time from 25 minutes to 3 minutes per request",
  "Increase 180-day PDC adherence rates from 65% to 80% across managed populations",
  "Reduce clinically irrelevant alerts by 70% while catching 99% of critical interactions",
  "Increase rural pharmacy clinical service volume by 50% within 6 months",
];

const FAKE_JTBD = [
  "When I am processing a prior auth, I want to auto-generate clinical justification, so I can get approval in minutes instead of hours.",
  "When I am reviewing a patient's refill history, I want to predict adherence risk, so I can intervene before they stop taking their medication.",
  "When I am dispensing a prescription, I want to see only clinically relevant alerts, so I can focus on real safety risks.",
  "When I am staffing a rural pharmacy, I want AI to handle routine clinical screenings, so I can focus on complex patient cases.",
];

const TEAM_NAMES = ["Squad Rx", "PharmAI", "Pill Pushers 2.0", "The Adherence Avengers"];

const MAS_PATTERNS: ("sequential" | "parallel" | "coordinator")[] = ["sequential", "parallel", "coordinator"];

export function isTestMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("test");
}

export async function addFakePlayers(sessionId: string, count: number = 6): Promise<void> {
  const shuffled = [...FAKE_NAMES].sort(() => Math.random() - 0.5);
  const names = shuffled.slice(0, count);

  for (const name of names) {
    await supabase.from("players").insert({
      id: uuidv4(),
      session_id: sessionId,
      name,
      is_host: false,
    });
  }
}

export async function createFakeTeams(sessionId: string): Promise<void> {
  const { data: players } = await supabase
    .from("players")
    .select()
    .eq("session_id", sessionId);

  if (!players || players.length < 2) return;

  const unassigned = players.filter((p) => !p.team_id);
  const teamCount = Math.min(TEAM_NAMES.length, Math.max(2, Math.ceil(unassigned.length / 3)));

  for (let i = 0; i < teamCount; i++) {
    const { data: team } = await supabase
      .from("teams")
      .insert({
        session_id: sessionId,
        name: TEAM_NAMES[i],
        members: [],
      })
      .select()
      .single();

    if (!team) continue;

    // Assign players round-robin
    const teamPlayers = unassigned.filter((_, idx) => idx % teamCount === i);
    const memberIds = teamPlayers.map((p) => p.id);

    await supabase
      .from("teams")
      .update({ members: memberIds })
      .eq("id", team.id);

    for (const p of teamPlayers) {
      await supabase
        .from("players")
        .update({ team_id: team.id })
        .eq("id", p.id);
    }
  }
}

export async function fillFakeStrategies(sessionId: string): Promise<void> {
  const { data: teams } = await supabase
    .from("teams")
    .select()
    .eq("session_id", sessionId);

  if (!teams) return;

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    if (team.ai_score) continue; // already submitted

    const score = Math.floor(Math.random() * 4) + 6; // 6-9
    const grades = ["B-", "B", "B+", "A-", "A"];

    await supabase
      .from("teams")
      .update({
        problem_statement: FAKE_PROBLEMS[i % FAKE_PROBLEMS.length],
        outcome_metric: FAKE_OUTCOMES[i % FAKE_OUTCOMES.length],
        job_to_be_done: FAKE_JTBD[i % FAKE_JTBD.length],
        mas_pattern: MAS_PATTERNS[i % MAS_PATTERNS.length],
        ai_score: score,
        ai_critique: `This strategy shows ${score >= 8 ? "excellent" : "solid"} impact-first thinking with clear clinical grounding.`,
      })
      .eq("id", team.id);
  }
}

export async function simulateFakeVotes(sessionId: string): Promise<void> {
  const { data: players } = await supabase
    .from("players")
    .select()
    .eq("session_id", sessionId);

  const { data: teams } = await supabase
    .from("teams")
    .select()
    .eq("session_id", sessionId);

  if (!players || !teams || teams.length < 2) return;

  for (const player of players) {
    // Vote for a random team that isn't their own
    const otherTeams = teams.filter((t) => t.id !== player.team_id);
    if (otherTeams.length === 0) continue;

    const votedTeam = otherTeams[Math.floor(Math.random() * otherTeams.length)];

    await supabase.from("votes").upsert(
      { team_id: votedTeam.id, voter_id: player.id, session_id: sessionId },
      { onConflict: "voter_id,session_id" }
    );
  }
}
