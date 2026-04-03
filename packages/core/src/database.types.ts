// =============================================================================
// database.types.ts — Sincronizado com migrations 00001–00010
// Última atualização: migration 00010 (taxonomia hierárquica — subcategories, exams_names)
// =============================================================================

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// -----------------------------------------------------------------------------
// profiles
// -----------------------------------------------------------------------------

export type SubscriptionStatus = 'free' | 'pro' | 'pro_canceled' | 'past_due' | 'active';

export interface Profile {
  id: string;                              // UUID — espelha auth.users.id
  email: string | null;
  full_name: string | null;
  is_admin: boolean | null;                // migration 00003
  subscription_status: SubscriptionStatus | null; // migration 00003 + 00014
  updated_at: string | null;
  /** ISO 8601 — null for free or active without set expiry — migration 00014 */
  subscription_expires_at: string | null;
  /** Counter reset daily — O(1) quota check — migration 00014 */
  daily_question_count: number;
  /** Date string (YYYY-MM-DD) — migration 00014 */
  daily_question_reset_at: string;
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
// subcategories — migration 00010
// -----------------------------------------------------------------------------

export interface Subcategory {
  id: string;
  tenant_id: string;
  subject_id: string; // UUID → subjects.id
  name: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// exam_boards (Bancas) — migration 00009
// -----------------------------------------------------------------------------

export interface ExamBoard {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// institutions (Órgãos / Instituições) — migration 00009
// -----------------------------------------------------------------------------

export interface Institution {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// exams_names (Provas) — migration 00010
// -----------------------------------------------------------------------------

export interface ExamName {
  id: string;
  tenant_id: string;
  name: string;
  year: number | null;
  created_at: string;
}

// -----------------------------------------------------------------------------
// questions
// -----------------------------------------------------------------------------

export interface QuestionOption {
  id: string;       // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
  comment?: string;
}

export interface Question {
  id: string;
  seq_id: number;        // BIGSERIAL — migration 00005
  tenant_id: string;
  subject_id: string;    // UUID → subjects.id
  text: string;
  options: QuestionOption[];
  correct_option: string;

  /** ENUM question_difficulty — migration 00009. */
  difficulty: DifficultyLevel;

  general_explanation: string | null;

  /** FK para subcategories.id — migration 00010. Substituiu subcategories JSONB + subcategory VARCHAR. */
  subcategory_id: string | null;

  /** FK para exam_boards.id — migration 00009. */
  exam_board_id: string | null;

  /** FK para institutions.id — migration 00009. */
  institution_id: string | null;

  /** FK para exams_names.id — migration 00010. Substituiu exam_name VARCHAR + year INT. */
  exam_name_id: string | null;

  /** URL pública da imagem no Cloudflare R2 — migration 00007. */
  image_url: string | null;

  /** Flashcard pré-processado — migration 00012. */
  flashcard_front: string | null;
  flashcard_back: string | null;
  flashcard_hint: string | null;

  /** Rastreabilidade da IA — migration 00012. */
  ai_filled_fields: string[] | null;
  ai_confidence: Record<string, number> | null;
  ai_engine_version: number | null;
  operator_hint: string | null;

  created_at: string;
}

// -----------------------------------------------------------------------------
// user_question_history — migration 00005
// -----------------------------------------------------------------------------

export interface UserQuestionHistory {
  user_id: string;
  question_id: string;
  tenant_id: string;
  answered_at: string;
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

// -----------------------------------------------------------------------------
// user_flashcards — migration 00013
// -----------------------------------------------------------------------------

export interface UserFlashcard {
  id: string;
  user_id: string;
  tenant_id: string;
  subject_id: string | null;
  front: string;
  back: string;
  created_at: string;
}

export type FlashcardRating = 'again' | 'hard' | 'medium' | 'easy';

// -----------------------------------------------------------------------------
// user_flashcard_reviews — migration 00013 (SM-2 repetição espaçada)
// -----------------------------------------------------------------------------

export interface UserFlashcardReview {
  id: string;
  user_id: string;
  tenant_id: string;
  /** Questão oficial — mutuamente exclusivo com user_flashcard_id. */
  question_id: string | null;
  /** Card pessoal — mutuamente exclusivo com question_id. */
  user_flashcard_id: string | null;
  rating: FlashcardRating;
  reviewed_at: string;
  ease_factor: number;
  interval_days: number;
  /** ISO date string — próxima data de revisão. */
  next_review: string;
}

// -----------------------------------------------------------------------------
// payment_gateway_configs — migration 00014
// -----------------------------------------------------------------------------

export type GatewayName = 'stripe' | 'asaas' | 'mercadopago';

export interface PaymentGatewayConfig {
  id:                 string;
  gateway_name:       GatewayName;
  display_label:      string;
  is_active:          boolean;
  /** AES-256-GCM ciphertext — never expose to client */
  secret_key_enc:     string | null;
  pub_key_enc:        string | null;
  webhook_secret_enc: string | null;
  updated_at:         string;
  updated_by:         string | null;
}

// -----------------------------------------------------------------------------
// billing_subscriptions — migration 00014
// -----------------------------------------------------------------------------

export type BillingStatus = 'active' | 'canceled' | 'past_due' | 'expired';
export type BillingPlan   = 'pro_monthly' | 'pro_annual';

export interface BillingSubscription {
  id:                      string;
  user_id:                 string;
  tenant_id:               string;
  gateway:                 GatewayName;
  gateway_customer_id:     string;
  gateway_subscription_id: string | null;
  gateway_payment_id:      string | null;
  plan:                    BillingPlan;
  status:                  BillingStatus;
  current_period_start:    string | null;
  current_period_end:      string | null;
  canceled_at:             string | null;
  created_at:              string;
  updated_at:              string;
}

// -----------------------------------------------------------------------------
// billing_webhook_events — migration 00014
// -----------------------------------------------------------------------------

export interface BillingWebhookEvent {
  id:               string;
  gateway:          GatewayName;
  gateway_event_id: string;
  event_type:       string;
  raw_payload:      Record<string, unknown>;
  processed:        boolean;
  processed_at:     string | null;
  error_message:    string | null;
  received_at:      string;
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

      subcategories: {
        Row: Subcategory;
        Insert: Omit<Subcategory, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Pick<Subcategory, 'name'>>;
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

      exams_names: {
        Row: ExamName;
        Insert: Omit<ExamName, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Pick<ExamName, 'name' | 'year'>>;
      };

      questions: {
        Row: Question;
        Insert: Omit<Question, 'id' | 'seq_id' | 'created_at'> & {
          id?: string;
          created_at?: string;
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

      user_flashcards: {
        Row: UserFlashcard;
        Insert: Omit<UserFlashcard, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Pick<UserFlashcard, 'front' | 'back' | 'subject_id'>>;
      };

      user_flashcard_reviews: {
        Row: UserFlashcardReview;
        Insert: Omit<UserFlashcardReview, 'id' | 'reviewed_at'> & { id?: string; reviewed_at?: string };
        Update: never;
      };

      payment_gateway_configs: {
        Row: PaymentGatewayConfig;
        Insert: Omit<PaymentGatewayConfig, 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Omit<PaymentGatewayConfig, 'id'>>;
      };

      billing_subscriptions: {
        Row: BillingSubscription;
        Insert: Omit<BillingSubscription, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Pick<BillingSubscription,
          'status' | 'current_period_start' | 'current_period_end' | 'canceled_at' | 'updated_at'
        >>;
      };

      billing_webhook_events: {
        Row: BillingWebhookEvent;
        Insert: Omit<BillingWebhookEvent, 'id' | 'received_at'> & { id?: string; received_at?: string };
        Update: Pick<BillingWebhookEvent, 'processed' | 'processed_at' | 'error_message'>;
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

      /** Atomic gateway swap — migration 00014 */
      set_active_gateway: {
        Args: { p_gateway_name: GatewayName };
        Returns: void;
      };

      /** O(1) daily question quota check-and-increment — migration 00014 */
      check_and_increment_daily_quota: {
        Args: { p_user_id: string };
        Returns: Array<{
          allowed:       boolean;
          count_after:   number;
          limit_reached: boolean;
        }>;
      };
    };

    Enums: {
      question_difficulty: DifficultyLevel;
    };
  };
}
