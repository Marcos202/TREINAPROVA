export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Profile {
  id: string; // UUID
  email: string | null;
  full_name: string | null;
  updated_at: string | null;
}

export interface Subject {
  id: string; // UUID
  tenant_id: string; // e.g., 'med', 'oab', 'enem'
  name: string;
  created_at: string;
}

export interface Question {
  id: string; // UUID
  tenant_id: string;
  subject_id: string; // UUID from Subject
  text: string;
  options: Record<string, string>; // e.g., { "a": "First option", "b": "Second option" }
  correct_option: string; // e.g., "a"
  difficulty: DifficultyLevel;
  created_at: string;
}

export interface Exam {
  id: string; // UUID
  tenant_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'updated_at'> & { updated_at?: string };
        Update: Partial<Omit<Profile, 'updated_at'>> & { updated_at?: string };
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Subject, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Question, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };
      exams: {
        Row: Exam;
        Insert: Omit<Exam, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Exam, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };
    };
  };
}
