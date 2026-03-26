-- =============================================================================
-- Migration 00009: Normalização de Metadados de Questões
-- =============================================================================
-- Fase 1 + 2 do Plano de Dados:
--   1. Converte `difficulty` de VARCHAR para ENUM tipado
--   2. Cria tabelas de domínio `exam_boards` e `institutions` com
--      constraint de unicidade case-insensitive por tenant
--   3. Adiciona FK columns em `questions` (nullable — sem migração de dados)
--   4. Remove as colunas de texto livre `exam_board` e `institution`
--   5. Habilita RLS com políticas de leitura (autenticados) e escrita (admin)
--
-- Ambiente: desenvolvimento — sem dados legados para migrar.
-- Aplicar no Supabase Dashboard → SQL Editor.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 1 — ENUM de Dificuldade
-- ─────────────────────────────────────────────────────────────────────────────

-- A materialized view subject_question_counts referencia difficulty.
-- É necessário dropá-la antes do ALTER COLUMN e recriá-la depois.
DROP MATERIALIZED VIEW IF EXISTS public.subject_question_counts;

-- Cria o tipo ENUM (idempotente via DO block)
DO $$ BEGIN
  CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Altera a coluna difficulty para usar o ENUM
-- O USING faz o cast seguro de VARCHAR existente para ENUM
-- Qualquer valor fora de ('easy','medium','hard') causará erro controlado aqui
ALTER TABLE public.questions
  ALTER COLUMN difficulty TYPE public.question_difficulty
    USING difficulty::public.question_difficulty;

COMMENT ON COLUMN public.questions.difficulty IS
  'Nível de dificuldade tipado. Valores: easy | medium | hard (ENUM question_difficulty).';

-- Recria a materialized view (mesma definição de migration 00005)
CREATE MATERIALIZED VIEW public.subject_question_counts AS
  SELECT
    subject_id,
    tenant_id,
    difficulty,
    COUNT(*) AS question_count
  FROM public.questions
  GROUP BY subject_id, tenant_id, difficulty;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sqc_subject_diff
  ON public.subject_question_counts(subject_id, difficulty);

CREATE INDEX IF NOT EXISTS idx_sqc_tenant
  ON public.subject_question_counts(tenant_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 2 — Tabela exam_boards (Bancas)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_boards (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  VARCHAR     NOT NULL,
  name       VARCHAR     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade case-insensitive: impede "VUNESP" e "vunesp" no mesmo tenant
CREATE UNIQUE INDEX IF NOT EXISTS exam_boards_tenant_name_unique
  ON public.exam_boards (tenant_id, LOWER(name));

COMMENT ON TABLE public.exam_boards IS
  'Bancas organizadoras por vertical (tenant). Normaliza o campo exam_board da tabela questions.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 3 — Tabela institutions (Órgãos / Instituições)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.institutions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  VARCHAR     NOT NULL,
  name       VARCHAR     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS institutions_tenant_name_unique
  ON public.institutions (tenant_id, LOWER(name));

COMMENT ON TABLE public.institutions IS
  'Órgãos e instituições por vertical (tenant). Normaliza o campo institution da tabela questions.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 4 — Colunas FK em questions
-- ─────────────────────────────────────────────────────────────────────────────

-- Nullable: questões cadastradas antes desta migration não terão vínculo
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS exam_board_id  UUID REFERENCES public.exam_boards(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.questions.exam_board_id IS
  'FK para exam_boards. Substitui o antigo campo de texto livre exam_board.';
COMMENT ON COLUMN public.questions.institution_id IS
  'FK para institutions. Substitui o antigo campo de texto livre institution.';

-- Índices para aceleração de JOINs e BI queries
CREATE INDEX IF NOT EXISTS questions_exam_board_id_idx ON public.questions (exam_board_id);
CREATE INDEX IF NOT EXISTS questions_institution_id_idx ON public.questions (institution_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 5 — Remoção das colunas de texto livre
-- (seguro em dev — sem dados legados para preservar)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.questions
  DROP COLUMN IF EXISTS exam_board,
  DROP COLUMN IF EXISTS institution;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 6 — Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.exam_boards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- ── exam_boards ──────────────────────────────────────────────────────────────

-- Leitura: qualquer usuário autenticado
CREATE POLICY "exam_boards_select_authenticated"
  ON public.exam_boards FOR SELECT
  TO authenticated
  USING (true);

-- Inserção: apenas admin
CREATE POLICY "exam_boards_insert_admin"
  ON public.exam_boards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Atualização: apenas admin
CREATE POLICY "exam_boards_update_admin"
  ON public.exam_boards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Deleção: apenas admin
CREATE POLICY "exam_boards_delete_admin"
  ON public.exam_boards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ── institutions ─────────────────────────────────────────────────────────────

CREATE POLICY "institutions_select_authenticated"
  ON public.institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "institutions_insert_admin"
  ON public.institutions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "institutions_update_admin"
  ON public.institutions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "institutions_delete_admin"
  ON public.institutions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
