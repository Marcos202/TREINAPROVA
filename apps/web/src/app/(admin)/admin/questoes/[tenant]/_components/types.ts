export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface QuestionOption {
  id: string;    // 'A' | 'B' | 'C' | 'D' | 'E'
  text: string;
  comment?: string;
}

export interface Subject {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

/** Banca organizadora — migration 00009 */
export interface ExamBoard {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

/** Órgão / Instituição — migration 00009 */
export interface Institution {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  tenant_id: string;
  subject_id: string;
  text: string;
  options: QuestionOption[];
  correct_option: string;
  /** ENUM question_difficulty — migration 00009. */
  difficulty: DifficultyLevel;
  general_explanation: string | null;
  /**
   * JSONB array — migration 00005. Coluna canônica.
   * Ex: ["Cardiologia", "Neurologia"]
   */
  subcategories: string[];
  /**
   * VARCHAR legado — migration 00004. Mantido até drop confirmado.
   * @deprecated use subcategories
   */
  subcategory?: string | null;
  year: number | null;
  /** FK para exam_boards.id — migration 00009. */
  exam_board_id: string | null;
  /** FK para institutions.id — migration 00009. */
  institution_id: string | null;
  exam_name: string | null;
  /** URL pública da imagem no Cloudflare R2 — migration 00007. */
  image_url: string | null;
  created_at: string;
  /** Populated via PostgREST join: .select('*, subjects(name)') */
  subjects?: { name: string } | null;
  /** Populated via PostgREST join: .select('*, exam_boards(name)') */
  exam_boards?: { name: string } | null;
  /** Populated via PostgREST join: .select('*, institutions(name)') */
  institutions?: { name: string } | null;
}
