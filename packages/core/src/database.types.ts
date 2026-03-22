// =============================================================================
// database.types.ts — Sincronizado com migrations 00001–00005
// Última atualização: migration 00005 (performance + sessions)
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
  difficulty: DifficultyLevel;

  // --- Metadados avançados (migration 00004) ---
  general_explanation: string | null;

  /**
   * Array JSONB de subcategorias — migration 00005.
   * Substituiu a coluna subcategory VARCHAR (texto contendo JSON).
   * Indexado via GIN para queries: WHERE subcategories @> '["Cardiologia"]'
   */
  subcategories: string[];

  /** Coluna legada — mantida até validação da migração de dados. @deprecated use subcategories */
  subcategory?: string | null;

  year: number | null;
  exam_board: string | null;    // Banca
  institution: string | null;   // Órgão / Instituição
  exam_name: string | null;     // Nome da prova

  /** URL pública da imagem no Cloudflare R2 — migration 00007. */
  image_url: string | null;

  created_at: string; // ISO 8601
}

// -----------------------------------------------------------------------------
// user_question_history — migration 00005
// Rastreamento de respostas por usuário. PK composta: (user_id, question_id).
// -----------------------------------------------------------------------------

export interface UserQuestionHistory {
  user_id: string;       // UUID → auth.users.id
  question_id: string;   // UUID → questions.id
  tenant_id: string;
  answered_at: string;   // ISO 8601
  is_correct: boolean | null;
  time_spent_ms: number | null; // Tempo de resposta em milissegundos (analytics)
}

// -----------------------------------------------------------------------------
// question_sessions — migration 00005
// Pool pré-computado de questões para entrega eficiente e sem repetição.
// -----------------------------------------------------------------------------

export interface QuestionSession {
  id: string;             // UUID — PK da sessão
  user_id: string;        // UUID → auth.users.id
  tenant_id: string;

  /** Array ordenado de UUIDs de questões — o "pool" da sessão. */
  question_ids: string[];

  current_index: number;  // Índice da próxima questão a ser entregue (0-based)
  total: number;          // Tamanho total do pool

  /**
   * Snapshot dos filtros usados para construir o pool.
   * Ex: { "difficulty": "medium", "subject_ids": ["uuid1", "uuid2"] }
   */
  filters: Record<string, unknown>;

  correct_count: number;  // Acertos acumulados na sessão
  wrong_count: number;    // Erros acumulados na sessão

  created_at: string;     // ISO 8601
  expires_at: string;     // ISO 8601 — TTL padrão: 24h após criação
  completed_at: string | null; // null enquanto em andamento
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
// Uso: createClient<Database>(url, key)
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
        Update: Partial<Omit<Subject, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };

      questions: {
        Row: Question;
        /**
         * seq_id é BIGSERIAL — gerado automaticamente pelo DB, nunca fornecido no Insert.
         * subcategory (legada) é opcional no Insert.
         */
        Insert: Omit<Question, 'id' | 'seq_id' | 'created_at' | 'subcategory'> & {
          id?: string;
          created_at?: string;
          subcategory?: string | null;
        };
        Update: Partial<Omit<Question, 'id' | 'seq_id' | 'created_at'>>;
      };

      user_question_history: {
        Row: UserQuestionHistory;
        /** answered_at tem DEFAULT NOW() no DB — opcional no Insert */
        Insert: Omit<UserQuestionHistory, 'answered_at'> & { answered_at?: string };
        Update: Pick<UserQuestionHistory, 'is_correct' | 'time_spent_ms'>;
      };

      question_sessions: {
        Row: QuestionSession;
        /**
         * id, correct_count, wrong_count, created_at, expires_at têm defaults no DB.
         * completed_at é null por padrão.
         */
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
        Update: Partial<Omit<Exam, 'id' | 'created_at'>> & { id?: string; created_at?: string };
      };
    };

    Views: {
      /** View materializada — migration 00005. Contagem de questões por subject+difficulty. */
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
      /** Função SQL para construir pool balanceado — migration 00005. */
      build_balanced_question_pool: {
        Args: {
          p_tenant_id: string;
          p_filters: Record<string, unknown>;
          p_total: number;
          p_exclude_ids?: string[];
        };
        Returns: string[]; // UUID[]
      };
    };
  };
}
