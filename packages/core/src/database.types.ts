// =============================================================================
// database.types.ts — Sincronizado com migrations 00001–00009
// Última atualização: migration 00009 (normalização de metadados — exam_boards, institutions, difficulty ENUM)
// =============================================================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// -----------------------------------------------------------------------------
// profiles
// -----------------------------------------------------------------------------

export interface Profile {
  id: string;                        // UUID — espelha auth.users.id
  email: string | null;
  full_name: string | null;
  is_admin: boolean | null;          // migration 00003
  subscription_status: string | null; // migration 00003: 'free' | 'active' | ...
  updated_at: string | null;
}

// -----------------------------------------------------------------------------
// subjects
// -----------------------------------------------------------------------------

export interface Subject {
  id: string;         // UUID
  tenant_id: string;  // e.g. 'med' | 'oab' | 'enem' | 'vestibulares'
  name: string;
  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// exam_boards (Bancas) — migration 00009
// -----------------------------------------------------------------------------

export interface ExamBoard {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// institutions (Órgãos / Instituições) — migration 00009
// -----------------------------------------------------------------------------

export interface Institution {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// questions
// -----------------------------------------------------------------------------

/**
 * Uma alternativa de resposta, armazenada no array JSONB `options`.
 * Estrutura: [{ id: 'A', text: '...', comment: '...' }, ...]
 */
export interface QuestionOption {
  id: string;       // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
  comment?: string; // Comentário/explicação desta alternativa (opcional)
}

export interface Question {
  id: string;            // UUID
  seq_id: number;        // BIGSERIAL — migration 00005: chave para range-sampling eficiente
  tenant_id: string;
  subject_id: string;    // UUID → subjects.id
  text: string;

  /** Array JSONB de alternativas. Substituiu o antigo Record<string, string>. */
  options: QuestionOption[];

  correct_option: string;   // e.g. 'A'

  /** ENUM question_difficulty — migration 00009. Tipado no Postgres. */
  difficulty: DifficultyLevel;

  // --- Metadados avançados (migration 00004) ---
  general_explanation: string | null;

  /**
   * Array JSONB de subcategorias — migration 00005.
   * Indexado via GIN para queries: WHERE subcategories @> '["Cardiologia"]'
   */
  subcategories: string[];

  /** Coluna legada — mantida até validação da migração de dados. @deprecated use subcategories */
  subcategory?: string | null;

  year: number | null;

  /**
   * FK para exam_boards.id — migration 00009.
   * Substituiu a coluna de texto livre `exam_board`.
   */
  exam_board_id: string | null;

  /**
   * FK para institutions.id — migration 00009.
   * Substituiu a coluna de texto livre `institution`.
   */
  institution_id: string | null;

  exam_name: string | null; // Nome da prova (texto livre — normalização futura)

  /** URL pública da imagem no Cloudflare R2 — migration 00007. */
  image_url: string | null;

  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// user_question_history — migration 00005
// -----------------------------------------------------------------------------

export interface UserQuestionHistory {
  user_id: string;       // UUID → auth.users.id
  question_id: string;   // UUID → questions.id
  tenant_id: string;
  answered_at: string;   // ISO 8601
  is_correct: boolean | null;
  time_spent_ms: number | null;
}

// -----------------------------------------------------------------------------
// question_sessions — migration 00005
// -----------------------------------------------------------------------------

export interface QuestionSession {
  id: string;
  user_id: string;
  tenant_id: string;
  question_ids: string[];
  current_index: number;
  total: number;
  filters: Record<string, unknown>;
  correct_count: number;
  wrong_count: number;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

// -----------------------------------------------------------------------------
// exams (simulados estruturados)
// -----------------------------------------------------------------------------

export interface Exam {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

// =============================================================================
// Database — mapa completo de tabelas para o cliente Supabase tipado
// =============================================================================

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
        Update: Partial<Omit<Subject, 'id' | 'created_at'>>;
      };

      exam_boards: {
        Row: ExamBoard;
        Insert: Omit<ExamBoard, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Pick<ExamBoard, 'name'>>;
      };

      institutions: {
        Row: Institution;
        Insert: Omit<Institution, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Pick<Institution, 'name'>>;
      };

      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'seq_id' | 'created_at' | 'subcategory'> & {
          id?: string;
          created_at?: string;
          subcategory?: string | null;
        };
        Update: Partial<Omit<Question, 'id' | 'seq_id' | 'created_at'>>;
      };

      user_question_history: {
        Row: UserQuestionHistory;
        Insert: Omit<UserQuestionHistory, 'answered_at'> & { answered_at?: string };
        Update: Pick<UserQuestionHistory, 'is_correct' | 'time_spent_ms'>;
      };

      question_sessions: {
        Row: QuestionSession;
        Insert: Omit<QuestionSession, 'id' | 'correct_count' | 'wrong_count' | 'created_at' | 'expires_at' | 'completed_at'> & {
          id?: string;
          correct_count?: number;
          wrong_count?: number;
          created_at?: string;
          expires_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Pick<QuestionSession, 'current_index' | 'correct_count' | 'wrong_count' | 'completed_at'>>;
      };

      exams: {
        Row: Exam;
        Insert: Omit<Exam, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Exam, 'id' | 'created_at'>>;
      };
    };

    Views: {
      subject_question_counts: {
        Row: {
          subject_id: string;
          tenant_id: string;
          difficulty: DifficultyLevel;
          question_count: number;
        };
      };
    };

    Functions: {
      build_balanced_question_pool: {
        Args: {
          p_tenant_id: string;
          p_filters: Record<string, unknown>;
          p_total: number;
          p_exclude_ids?: string[];
        };
        Returns: string[];
      };
    };

    Enums: {
      question_difficulty: DifficultyLevel;
    };
  };
}
