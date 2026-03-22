-- =============================================================================
-- Migration 00005: Performance Indexes + Session Architecture + User History
-- Target: 100k+ questions, smart random delivery, no-repeat sessions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CRITICAL INDEXES — eliminam full table scans em questions
-- ---------------------------------------------------------------------------

-- Filtro principal: WHERE tenant_id = 'med'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_tenant
  ON public.questions(tenant_id);

-- Filtro composto mais comum: tenant + subject (para distribuição por disciplina)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_tenant_subject
  ON public.questions(tenant_id, subject_id);

-- Filtro composto: tenant + difficulty (para balancear por dificuldade)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_tenant_difficulty
  ON public.questions(tenant_id, difficulty);

-- Combinado: viabiliza pool building eficiente (tenant + subject + difficulty)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_subject_difficulty
  ON public.questions(subject_id, difficulty);

-- Índice em subject_id isolado (FK lookup e joins)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_subject_id
  ON public.questions(subject_id);

-- ---------------------------------------------------------------------------
-- 2. SEQ_ID — chave sequencial para sampling eficiente
--
-- UUIDs são aleatórios, impossibilitando range-based random sampling.
-- Um BIGSERIAL permite o padrão "random within range" que é ordens de
-- magnitude mais rápido que ORDER BY RANDOM() em tabelas grandes:
--
--   SELECT id FROM questions
--   WHERE tenant_id = 'med'
--     AND seq_id >= floor(random() * (max_seq - min_seq) + min_seq)
--   LIMIT 1;
--   — executa em < 1ms com o índice abaixo.
-- ---------------------------------------------------------------------------

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS seq_id BIGSERIAL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_seq
  ON public.questions(seq_id);

CREATE INDEX IF NOT EXISTS idx_questions_tenant_seq
  ON public.questions(tenant_id, seq_id);

CREATE INDEX IF NOT EXISTS idx_questions_subject_seq
  ON public.questions(subject_id, seq_id);

-- ---------------------------------------------------------------------------
-- 3. SUBCATEGORIES — migrar de VARCHAR (JSON em texto) para JSONB real
--
-- Benefícios:
--   • Operador @> (contains) utilizável com GIN index
--   • Queries como: WHERE subcategories @> '["Cardiologia"]'::jsonb
--   • Elimina o ILIKE frágil e não-indexável
-- ---------------------------------------------------------------------------

-- Adicionar coluna JSONB
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS subcategories JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes da coluna subcategory (VARCHAR)
-- Lida com: NULL, JSON array string, e string simples (fallback)
UPDATE public.questions
SET subcategories = CASE
  WHEN subcategory IS NULL OR subcategory = ''
    THEN '[]'::jsonb
  WHEN subcategory LIKE '[%'
    THEN subcategory::jsonb                    -- já é JSON array
  ELSE
    jsonb_build_array(subcategory)             -- string simples → array de 1 elemento
END
WHERE subcategories = '[]'::jsonb;

-- GIN index para queries de array contains (ex: filtra por "Cardiologia")
CREATE INDEX IF NOT EXISTS idx_questions_subcategories
  ON public.questions USING gin(subcategories);

-- Manter coluna legada por ora (não fazer DROP até validar migração)
-- DROP COLUMN subcategory;  -- executar manualmente após validação

-- ---------------------------------------------------------------------------
-- 4. USER_QUESTION_HISTORY — rastreamento de respostas
--
-- Finalidades:
--   • Evitar repetição inter-sessões ("você já respondeu esta")
--   • Analytics de desempenho por disciplina
--   • Base para algoritmo de repetição espaçada futura
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_question_history (
  user_id       UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id   UUID    NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  tenant_id     VARCHAR(50) NOT NULL,
  answered_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_correct    BOOLEAN,
  time_spent_ms INT,         -- tempo em ms para responder (analytics)
  PRIMARY KEY (user_id, question_id)  -- garante unicidade, evita duplicatas
);

ALTER TABLE public.user_question_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own history" ON public.user_question_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own history" ON public.user_question_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lookup principal: quais questões o usuário respondeu neste tenant
CREATE INDEX IF NOT EXISTS idx_history_user_tenant
  ON public.user_question_history(user_id, tenant_id);

-- Para "questões respondidas recentemente" (janela de tempo)
CREATE INDEX IF NOT EXISTS idx_history_user_tenant_date
  ON public.user_question_history(user_id, tenant_id, answered_at DESC);

-- Para analytics por questão: quantos acertaram/erraram
CREATE INDEX IF NOT EXISTS idx_history_question
  ON public.user_question_history(question_id);

-- ---------------------------------------------------------------------------
-- 5. QUESTION_SESSIONS — pool pré-computado para entrega eficiente
--
-- Fluxo:
--   1. Usuário clica "Iniciar Banco" → Edge Function/Server Action cria sessão
--   2. Pool é calculado com distribuição inteligente (sem ORDER BY RANDOM() global)
--   3. IDs são salvos em ordem na coluna question_ids (UUID[])
--   4. Cada questão é servida via: WHERE id = question_ids[current_index]
--      → lookup por PK indexado, < 1ms
--   5. Ao responder, current_index++ e resposta salva em user_question_history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.question_sessions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id      VARCHAR(50) NOT NULL,

  -- Pool pré-computado: array ordenado de UUIDs das questões
  question_ids   UUID[]      NOT NULL,

  -- Progresso
  current_index  INT         NOT NULL DEFAULT 0,
  total          INT         NOT NULL,

  -- Snapshot dos filtros usados para construir este pool
  -- Ex: { "difficulty": "medium", "subject_ids": ["uuid1","uuid2"] }
  filters        JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- Estatísticas da sessão (atualizadas ao longo)
  correct_count  INT         NOT NULL DEFAULT 0,
  wrong_count    INT         NOT NULL DEFAULT 0,

  -- Ciclo de vida
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  completed_at   TIMESTAMPTZ,        -- NULL enquanto em andamento

  CONSTRAINT valid_index CHECK (current_index >= 0 AND current_index <= total)
);

ALTER TABLE public.question_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.question_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Busca sessão ativa do usuário neste tenant
CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON public.question_sessions(user_id, tenant_id, created_at DESC)
  WHERE completed_at IS NULL;

-- ---------------------------------------------------------------------------
-- 6. SUBJECT_QUESTION_COUNTS — view materializada para distribuição eficiente
--
-- Evita COUNT(*) em tempo real para calcular cotas de distribuição.
-- Atualizada via trigger ou periodicamente.
-- ---------------------------------------------------------------------------

CREATE MATERIALIZED VIEW IF NOT EXISTS public.subject_question_counts AS
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

-- Refreshar após inserts em questions (executar manualmente ou via trigger):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.subject_question_counts;

-- Trigger para refresh automático (use com moderação em alto volume de inserts)
CREATE OR REPLACE FUNCTION public.refresh_subject_counts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.subject_question_counts;
  RETURN NULL;
END;
$$;

-- Só atualiza a cada INSERT de questão (batch-friendly)
DROP TRIGGER IF EXISTS trg_refresh_subject_counts ON public.questions;
CREATE TRIGGER trg_refresh_subject_counts
  AFTER INSERT OR DELETE ON public.questions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_subject_counts();

-- ---------------------------------------------------------------------------
-- 7. HELPER FUNCTION — distribuição balanceada por disciplina
--
-- Uso: SELECT * FROM build_balanced_question_pool('med', '{}', 20, '{uuid1,uuid2}');
-- Retorna: array de UUIDs balanceados por subject, excluindo já-vistos
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_balanced_question_pool(
  p_tenant_id      VARCHAR,
  p_filters        JSONB,
  p_total          INT,
  p_exclude_ids    UUID[]   DEFAULT '{}'
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result       UUID[]  := '{}';
  v_subject      RECORD;
  v_quota        INT;
  v_subject_ids  UUID[]  := '{}';
  v_total_weight NUMERIC := 0;
  v_batch        UUID[];
BEGIN
  -- 1. Calcular peso total por subject (proporcional ao volume de questões)
  FOR v_subject IN
    SELECT subject_id, SUM(question_count) AS weight
    FROM public.subject_question_counts
    WHERE tenant_id = p_tenant_id
    GROUP BY subject_id
    ORDER BY weight DESC
  LOOP
    v_total_weight := v_total_weight + v_subject.weight;
    v_subject_ids  := v_subject_ids || v_subject.subject_id;
  END LOOP;

  IF v_total_weight = 0 THEN
    RETURN '{}';
  END IF;

  -- 2. Para cada subject, selecionar quota proporcional ao volume
  FOR v_subject IN
    SELECT subject_id, SUM(question_count) AS weight
    FROM public.subject_question_counts
    WHERE tenant_id = p_tenant_id
    GROUP BY subject_id
    ORDER BY weight DESC
  LOOP
    -- Quota = (peso do subject / peso total) * total_questoes
    -- Mínimo 1 se o subject tem questões, máximo limitado ao disponível
    v_quota := GREATEST(1, ROUND((v_subject.weight::NUMERIC / v_total_weight) * p_total));

    -- Buscar IDs aleatórios deste subject, excluindo os já vistos
    -- ORDER BY RANDOM() aqui é OK: opera em ~1k rows por subject, não 100k
    SELECT ARRAY(
      SELECT id FROM public.questions
      WHERE subject_id = v_subject.subject_id
        AND tenant_id  = p_tenant_id
        AND (p_exclude_ids = '{}' OR id != ALL(p_exclude_ids))
        AND (
          p_filters->>'difficulty' IS NULL
          OR difficulty = p_filters->>'difficulty'
        )
      ORDER BY RANDOM()
      LIMIT v_quota
    ) INTO v_batch;

    v_result := v_result || v_batch;

    EXIT WHEN array_length(v_result, 1) >= p_total;
  END LOOP;

  -- 3. Truncar ao total exato e retornar (shuffle feito na aplicação)
  RETURN v_result[1:p_total];
END;
$$;

-- ---------------------------------------------------------------------------
-- Comentário final: o que NÃO fazer
--
-- ❌ SELECT * FROM questions ORDER BY RANDOM() LIMIT 20;
--    → Full scan em 100k rows → 400ms+
--
-- ✅ Usar build_balanced_question_pool() + question_sessions
--    → ORDER BY RANDOM() apenas em ~1k rows por subject → < 10ms total
--    → Entrega por ID indexado → < 1ms por questão
-- ---------------------------------------------------------------------------
