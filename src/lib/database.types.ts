export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string;
          code: string;
          status: "lobby" | "planning" | "voting" | "finished";
          created_at: string;
          host_id: string;
        };
        Insert: {
          id?: string;
          code: string;
          status?: "lobby" | "planning" | "voting" | "finished";
          created_at?: string;
          host_id: string;
        };
        Update: {
          id?: string;
          code?: string;
          status?: "lobby" | "planning" | "voting" | "finished";
          created_at?: string;
          host_id?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          members: string[];
          problem_statement: string | null;
          outcome_metric: string | null;
          mas_pattern: "sequential" | "parallel" | "coordinator" | null;
          job_to_be_done: string | null;
          ai_score: number | null;
          ai_critique: string | null;
          ceo_funded: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          members?: string[];
          problem_statement?: string | null;
          outcome_metric?: string | null;
          mas_pattern?: "sequential" | "parallel" | "coordinator" | null;
          job_to_be_done?: string | null;
          ai_score?: number | null;
          ai_critique?: string | null;
          ceo_funded?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          members?: string[];
          problem_statement?: string | null;
          outcome_metric?: string | null;
          mas_pattern?: "sequential" | "parallel" | "coordinator" | null;
          job_to_be_done?: string | null;
          ai_score?: number | null;
          ai_critique?: string | null;
          ceo_funded?: boolean;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          team_id: string;
          voter_id: string;
          session_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          voter_id: string;
          session_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          voter_id?: string;
          session_id?: string;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          team_id: string | null;
          is_host: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          team_id?: string | null;
          is_host?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          team_id?: string | null;
          is_host?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          team_id: string;
          team_name: string;
          vote_count: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type GameStatus = GameSession["status"];
