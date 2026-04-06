"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { generateRoomCode, generatePlayerId, setPlayerName } from "@/lib/game-utils";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setLoading(true);
    setError("");

    const playerId = generatePlayerId();
    setPlayerName(name.trim());
    const code = generateRoomCode();

    const { data, error: dbError } = await supabase
      .from("game_sessions")
      .insert({ code, host_id: playerId, status: "lobby" })
      .select()
      .single();

    if (dbError || !data) {
      setError("Failed to create session. Check your Supabase connection.");
      setLoading(false);
      return;
    }

    await supabase.from("players").insert({
      session_id: data.id,
      name: name.trim(),
      id: playerId,
      is_host: true,
    });

    router.push(`/lobby?session=${data.id}&code=${code}`);
  }

  async function handleJoin() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }
    setLoading(true);
    setError("");

    const playerId = generatePlayerId();
    setPlayerName(name.trim());

    const { data, error: dbError } = await supabase
      .from("game_sessions")
      .select()
      .eq("code", roomCode.trim().toUpperCase())
      .single();

    if (dbError || !data) {
      setError("Room not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    await supabase.from("players").insert({
      session_id: data.id,
      name: name.trim(),
      id: playerId,
      is_host: false,
    });

    router.push(`/lobby?session=${data.id}&code=${data.code}`);
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4 animate-fade-in">
          <Image
            src="/images/hero-rocket.png"
            alt="Impact Engine"
            width={180}
            height={180}
            className="mx-auto animate-bounce-in w-auto h-auto"
            priority
          />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary-light text-sm font-medium">
            AI Office Hours Workshop
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary-light via-secondary to-accent bg-clip-text text-transparent">
              Impact Engine
            </span>
          </h1>
          <p className="text-muted text-lg">
            The Billion Dollar Pivot &mdash; A real-time strategy game for
            product managers in the pharmacy clinical ecosystem
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 animate-slide-up">
          {mode === "choose" && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-lg"
                maxLength={30}
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode("create")}
                  className="btn-primary text-center"
                >
                  Host Game
                </button>
                <button
                  onClick={() => setMode("join")}
                  className="btn-secondary text-center"
                >
                  Join Game
                </button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Host a New Session</h2>
              <p className="text-muted text-sm">
                Create a room and share the code with your team.
              </p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                maxLength={30}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "Creating..." : "Create Room"}
                </button>
                <button
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="btn-secondary"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Join a Session</h2>
              <p className="text-muted text-sm">
                Enter the 6-character room code from your host.
              </p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                maxLength={30}
              />
              <input
                type="text"
                placeholder="Room code (e.g. ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="input-field font-mono text-center text-2xl tracking-widest"
                maxLength={6}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? "Joining..." : "Join Room"}
                </button>
                <button
                  onClick={() => { setMode("choose"); setError(""); }}
                  className="btn-secondary"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-danger text-sm text-center">{error}</p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-muted text-xs">
          Built for Outcomes.com AI Office Hours &middot; Impact-First Product Management
        </p>
      </div>
    </main>
  );
}
