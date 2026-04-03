// ── Super Importador — Tipos compartilhados ──────────────────────────────────

/** Campo de metadado com confiança retornado pelo Stage 2. */
export interface AiEnrichedMeta {
  valor: string;
  confidence: number;    // 0–100
  needs_review: boolean;
}

/** Campo numérico (ano) com confiança. */
export interface AiEnrichedMetaNumber {
  valor: number | null;
  confidence: number;
  needs_review: boolean;
}

/** Flashcard gerado pela IA. */
export interface AiFlashcard {
  front: string;
  back: string;
  hint: string;
  confidence: number;
}

/** Resultado bruto do Stage 1 (extração visual — sem inferências). */
export interface Stage1Result {
  enunciado: string;
  alternativas: { letra: string; texto: string }[];
  gabarito: string | null;
  banca_visivel: string | null;
  ano_visivel: number | null;
  orgao_visivel: string | null;
  numero_questao: number | null;
  qualidade_imagem: 'boa' | 'razoável' | 'ruim';
  erro?: string;
}

/** Resultado do Stage 2 (enriquecimento + flashcard). */
export interface Stage2Result {
  banca: AiEnrichedMeta;
  ano: AiEnrichedMetaNumber;
  orgao: AiEnrichedMeta;
  disciplina: AiEnrichedMeta;
  assunto: AiEnrichedMeta;
  dificuldade: AiEnrichedMeta;
  flashcard: AiFlashcard;
}

/** Dados combinados dos dois estágios para a tela de revisão. */
export interface EnrichedQuestion {
  stage1: Stage1Result;
  stage2: Stage2Result;
}

/** Estados da máquina de estados do Super Importador. */
export type ImportStep = 'idle' | 'processing' | 'review' | 'saved';
