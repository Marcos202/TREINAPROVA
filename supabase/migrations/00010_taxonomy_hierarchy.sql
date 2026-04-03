-- =============================================================================
-- Migration 00010: Taxonomia Hierárquica — Subcategorias e Provas
-- =============================================================================
-- Fase 3 do Plano de Dados:
--   1. Cria tabela `subcategories` — hierarquia Disciplina → Subcategoria (1:N)
--   2. Cria tabela `exams_names` — Provas com nome + ano por tenant
--   3. Adiciona FKs em `questions`: subcategory_id, exam_name_id
--   4. Remove colunas obsoletas: subcategories (JSONB array), subcategory
--      (VARCHAR legado), year (INT), exam_name (VARCHAR texto livre)
--   5. Habilita RLS com políticas de leitura (autenticados) e escrita (admin)
--
-- Pré-requisito: Migration 00009 aplicada com sucesso.
-- Ambiente: desenvolvimento — sem dados legados para migrar.
-- Aplicar no Supabase Dashboard → SQL Editor.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 1 — Tabela subcategories (Hierarquia Disciplina → Subcategoria)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subcategories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  VARCHAR     NOT NULL,
  subject_id UUID        NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name       VARCHAR     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade case-insensitive por disciplina: impede "Cardiologia" e "cardiologia" na mesma disciplina
CREATE UNIQUE INDEX IF NOT EXISTS subcategories_subject_name_unique
  ON public.subcategories (subject_id, LOWER(name));

CREATE INDEX IF NOT EXISTS subcategories_subject_id_idx ON public.subcategories (subject_id);
CREATE INDEX IF NOT EXISTS subcategories_tenant_id_idx  ON public.subcategories (tenant_id);

COMMENT ON TABLE public.subcategories IS
  'Subcategorias hierárquicas por disciplina (subject). Relação 1:N com subjects.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 2 — Tabela exams_names (Provas por tenant)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exams_names (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  VARCHAR     NOT NULL,
  name       VARCHAR     NOT NULL,
  year       INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidade: mesmo nome+ano não pode existir duas vezes no mesmo tenant
-- COALESCE(year, 0) trata NULL como 0 para comparação de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS exams_names_tenant_name_year_unique
  ON public.exams_names (tenant_id, LOWER(name), COALESCE(year, 0));

CREATE INDEX IF NOT EXISTS exams_names_tenant_id_idx ON public.exams_names (tenant_id);

COMMENT ON TABLE public.exams_names IS
  'Provas (nome + ano) por tenant. Substituiu os campos texto-livre exam_name e year em questions.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 3 — Colunas FK em questions
-- ─────────────────────────────────────────────────────────────────────────────

-- Nullable: questões existentes não quebram — apenas ficam sem vínculo
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exam_name_id   UUID REFERENCES public.exams_names(id)   ON DELETE SET NULL;

COMMENT ON COLUMN public.questions.subcategory_id IS
  'FK para subcategories. Substituiu o antigo JSONB array subcategories e VARCHAR subcategory.';
COMMENT ON COLUMN public.questions.exam_name_id IS
  'FK para exams_names. Substituiu os antigos campos exam_name (texto) e year (INT).';

CREATE INDEX IF NOT EXISTS questions_subcategory_id_idx ON public.questions (subcategory_id);
CREATE INDEX IF NOT EXISTS questions_exam_name_id_idx   ON public.questions (exam_name_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 4 — Remoção das colunas obsoletas
-- (seguro em dev — sem dados legados para preservar)
-- ─────────────────────────────────────────────────────────────────────────────

-- Nota: DROP COLUMN remove automaticamente quaisquer índices que dependam
-- exclusivamente da coluna (incluindo o GIN index em subcategories, se existir).

ALTER TABLE public.questions
  DROP COLUMN IF EXISTS subcategories,  -- JSONB array (migration 00005)
  DROP COLUMN IF EXISTS subcategory,    -- VARCHAR legado (migration 00004)
  DROP COLUMN IF EXISTS year,           -- INT (substituído por exams_names.year)
  DROP COLUMN IF EXISTS exam_name;      -- VARCHAR texto livre (substituído por FK)


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 5 — Row Level Security — subcategories
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subcategories_select_authenticated"
  ON public.subcategories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "subcategories_insert_admin"
  ON public.subcategories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "subcategories_update_admin"
  ON public.subcategories FOR UPDATE
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

CREATE POLICY "subcategories_delete_admin"
  ON public.subcategories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 6 — Row Level Security — exams_names
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.exams_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams_names_select_authenticated"
  ON public.exams_names FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "exams_names_insert_admin"
  ON public.exams_names FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "exams_names_update_admin"
  ON public.exams_names FOR UPDATE
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

CREATE POLICY "exams_names_delete_admin"
  ON public.exams_names FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
