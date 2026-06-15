import { createClient } from "@supabase/supabase-js";

type Database = {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          resume_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          resume_url: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          resume_url?: string;
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
      assessment_submissions: {
        Row: {
          id: string;
          candidate_id: string;
          assessment_session_id: string;
          website_figma_link: string | null;
          website_file_name: string | null;
          website_explanation: string;
          website_walkthrough_url: string;
          healthcare_figma_link: string | null;
          healthcare_file_name: string | null;
          healthcare_explanation: string;
          linkedin_post: string;
          linkedin_graphic_file_name: string | null;
          linkedin_graphic_figma_link: string | null;
          submitted_payload: Record<string, unknown>;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          assessment_session_id: string;
          website_figma_link?: string | null;
          website_file_name?: string | null;
          website_explanation: string;
          website_walkthrough_url: string;
          healthcare_figma_link?: string | null;
          healthcare_file_name?: string | null;
          healthcare_explanation: string;
          linkedin_post: string;
          linkedin_graphic_file_name?: string | null;
          linkedin_graphic_figma_link?: string | null;
          submitted_payload?: Record<string, unknown>;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          assessment_session_id?: string;
          website_figma_link?: string | null;
          website_file_name?: string | null;
          website_explanation?: string;
          website_walkthrough_url?: string;
          healthcare_figma_link?: string | null;
          healthcare_file_name?: string | null;
          healthcare_explanation?: string;
          linkedin_post?: string;
          linkedin_graphic_file_name?: string | null;
          linkedin_graphic_figma_link?: string | null;
          submitted_payload?: Record<string, unknown>;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_submissions_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_submissions_assessment_session_id_fkey";
            columns: ["assessment_session_id"];
            isOneToOne: true;
            referencedRelation: "assessment_sessions";
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
