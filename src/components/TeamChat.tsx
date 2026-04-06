"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generatePlayerId, getPlayerName } from "@/lib/game-utils";
import type { TeamMessage } from "@/lib/database.types";

interface Props {
  teamId: string;
}

export default function TeamChat({ teamId }: Props) {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const playerId = typeof window !== "undefined" ? generatePlayerId() : "";
  const playerName = typeof window !== "undefined" ? getPlayerName() || "Anonymous" : "Anonymous";

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("team_messages")
      .select()
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }, [teamId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${teamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as TeamMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    await supabase.from("team_messages").insert({
      team_id: teamId,
      player_id: playerId,
      player_name: playerName,
      message: text,
    });

    setSending(false);
  }

  return (
    <div className="glass-card flex flex-col h-64">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2">
        <span className="text-xs font-semibold text-primary-light">Team Chat</span>
        <span className="text-xs text-muted">({messages.length} messages)</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-4">
            Discuss your strategy with your team here!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.player_id === playerId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${
                  isMe
                    ? "bg-primary/30 text-foreground"
                    : "bg-surface-light text-foreground"
                }`}
              >
                {!isMe && (
                  <span className="text-xs font-semibold text-secondary block">{msg.player_name}</span>
                )}
                <p>{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-surface text-foreground text-sm px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:border-primary"
          maxLength={300}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="btn-primary text-xs px-3 py-1.5"
        >
          Send
        </button>
      </div>
    </div>
  );
}
