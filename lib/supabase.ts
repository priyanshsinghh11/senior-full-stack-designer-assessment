import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          resume_url: string | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          agreement_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          resume_url?: string | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          agreement_confirmed: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          resume_url?: string | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          agreement_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessment_sessions: {
        Row: {
          id: string;
          candidate_id: string;
          assessment_name: string;
          status: "draft" | "started" | "submitted" | "expired";
          started_at: string | null;
          expires_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          assessment_name: string;
          status?: "draft" | "started" | "submitted" | "expired";
          started_at?: string | null;
          expires_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          assessment_name?: string;
          status?: "draft" | "started" | "submitted" | "expired";
          started_at?: string | null;
          expires_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (client) {
    return client;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be a full HTTP or HTTPS Supabase URL.",
    );
  }

  client = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return client;
}
