-- ============================================================
-- Migration 00013: Sistema de Flashcards
-- ============================================================
-- Duas novas tabelas:
--   user_flashcards        — cards criados manualmente pelo aluno
--   user_flashcard_reviews — histórico de revisões SM-2 (repetição espaçada)
--
-- Design:
--   • Sem alterações em tabelas existentes — expansão pura.
--   • next_review calculado pela aplicação (flexibilidade para evoluir para FSRS).
--   • CONSTRAINT chk_exactly_one_source: cada review aponta para OU uma questão
--     oficial OU um card pessoal, nunca ambos, nunca nenhum.
-- ============================================================

-- ── Cards pessoais do aluno ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_flashcards (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   text        NOT NULL,
  subject_id  uuid        REFERENCES public.subjects(id) ON DELETE SET NULL,
  front       text        NOT NULL,
  back        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Histórico de revisões (SM-2 simplificado) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_flashcard_reviews (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id         text        NOT NULL,

  -- Fonte mutuamente exclusiva: questão oficial XOR card pessoal
  question_id       uuid        REFERENCES public.questions(id) ON DELETE CASCADE,
  user_flashcard_id uuid        REFERENCES public.user_flashcards(id) ON DELETE CASCADE,

  -- Classificação do aluno no momento da revisão
  rating            text        NOT NULL CHECK (rating IN ('again', 'hard', 'medium', 'easy')),

  reviewed_at       timestamptz NOT NULL DEFAULT now(),

  -- SM-2: fator de facilidade e intervalo calculados pela aplicação
  ease_factor       numeric(4,2) NOT NULL DEFAULT 2.5,
  interval_days     smallint     NOT NULL DEFAULT 1,

  -- Data da próxima revisão (computada pela aplicação antes do INSERT)
  next_review       date         NOT NULL DEFAULT (CURRENT_DATE + 1),

  CONSTRAINT chk_exactly_one_source CHECK (
    (question_id IS NULL) != (user_flashcard_id IS NULL)
  )
);

-- ── Índices ───────────────────────────────────────────────────────────────────

-- Player: "quais cards devo mostrar hoje nesta sessão?"
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_due
  ON public.user_flashcard_reviews (user_id, tenant_id, next_review);

-- Deduplicação: "já revisei esta questão antes?"
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_question
  ON public.user_flashcard_reviews (user_id, question_id)
  WHERE question_id IS NOT NULL;

-- Cards pessoais: listagem por aluno + tenant
CREATE INDEX IF NOT EXISTS idx_user_flashcards_user_tenant
  ON public.user_flashcards (user_id, tenant_id);

-- Cards pessoais: listagem por disciplina
CREATE INDEX IF NOT EXISTS idx_user_flashcards_subject
  ON public.user_flashcards (subject_id)
  WHERE subject_id IS NOT NULL;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.user_flashcards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_reviews  ENABLE ROW LEVEL SECURITY;

-- Aluno gerencia apenas os próprios cards
CREATE POLICY "user_flashcards_owner"
  ON public.user_flashcards
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Aluno gerencia apenas o próprio histórico
CREATE POLICY "user_flashcard_reviews_owner"
  ON public.user_flashcard_reviews
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
