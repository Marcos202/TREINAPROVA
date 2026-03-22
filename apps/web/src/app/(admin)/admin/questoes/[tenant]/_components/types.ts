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

export interface QuestionRow {
  id: string;
  tenant_id: string;
  subject_id: string;
  text: string;
  options: QuestionOption[];
  correct_option: string;
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
  exam_board: string | null;
  institution: string | null;
  exam_name: string | null;
  /** URL pública da imagem no Cloudflare R2 — migration 00007. */
  image_url: string | null;
  created_at: string;
  /** Populated via PostgREST join: .select('*, subjects(name)') */
  subjects?: { name: string } | null;
}
