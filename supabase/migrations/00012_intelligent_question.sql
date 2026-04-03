-- ============================================================
-- Migration 00012: Questão Inteligente — campos de flashcard e rastreabilidade de IA
-- ============================================================
-- Todos os campos são nullable para retrocompatibilidade.
-- Questões manuais pré-existentes continuam funcionando;
-- flashcard_front IS NULL indica "flashcard ainda não gerado".
-- ============================================================

ALTER TABLE public.questions
  -- ── Flashcard pré-processado (gerado no momento do cadastro) ──
  ADD COLUMN IF NOT EXISTS flashcard_front text,        -- Frente: pergunta concisa de memorização
  ADD COLUMN IF NOT EXISTS flashcard_back  text,        -- Verso: resposta direta e memorável
  ADD COLUMN IF NOT EXISTS flashcard_hint  text,        -- Dica: mnemônico ou gancho de memorização (opcional)

  -- ── Rastreabilidade da IA ────────────────────────────────
  -- Lista de campos que foram preenchidos pela IA (para auditoria e re-processamento futuro)
  ADD COLUMN IF NOT EXISTS ai_filled_fields  text[],

  -- Score de confiança por campo (0-100), tal qual retornado pelo LLM
  -- Ex: {"banca": 87, "ano": 93, "orgao": 52, "flashcard": 95}
  ADD COLUMN IF NOT EXISTS ai_confidence     jsonb,

  -- Versão do prompt de enriquecimento usado (permite re-processar quando o prompt melhorar)
  ADD COLUMN IF NOT EXISTS ai_engine_version smallint DEFAULT 1,

  -- Instrução livre do operador usada no cadastro (preservada para auditoria e re-run)
  ADD COLUMN IF NOT EXISTS operator_hint     text;

-- ── Índice: busca rápida de questões COM flashcard disponível ──
-- Usado pela feature do aluno (tela de flashcards pós-erro)
CREATE INDEX IF NOT EXISTS idx_questions_has_flashcard
  ON public.questions (tenant_id, (flashcard_front IS NOT NULL))
  WHERE flashcard_front IS NOT NULL;

-- ── Índice: busca por versão do engine (re-processamento em lote futuro) ──
CREATE INDEX IF NOT EXISTS idx_questions_ai_engine_version
  ON public.questions (ai_engine_version)
  WHERE ai_engine_version IS NOT NULL;
