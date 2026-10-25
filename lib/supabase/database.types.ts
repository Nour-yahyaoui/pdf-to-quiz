/**
 * Hand-maintained database types mirroring supabase/migrations/0001_init.sql.
 * Kept in the exact shape Supabase's generated types use so `supabase gen types`
 * can replace this file later without touching application code.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Difficulty = "easy" | "medium" | "hard";

export interface Database {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          pdf_name: string;
          difficulty: Difficulty | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pdf_name: string;
          difficulty?: Difficulty | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quizzes"]["Insert"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          explanation: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          options: string[];
          correct_answer: string;
          explanation?: string | null;
          order_index: number;
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers: string[] | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          answers?: string[] | null;
          completed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
