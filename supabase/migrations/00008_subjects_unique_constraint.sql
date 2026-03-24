-- =============================================================================
-- Migration 00008: Unicidade case-insensitive de disciplinas por tenant
-- =============================================================================
-- Antes desta migration não havia constraint de unicidade na tabela subjects,
-- permitindo duplicatas como "Cirurgia" e "cirurgia" no mesmo tenant.
-- Este índice único garante integridade no nível do banco de dados.
-- Aplicar no Supabase Dashboard → SQL Editor
-- =============================================================================

-- Índice único case-insensitive: impede "Cirurgia" e "CIRURGIA" no mesmo tenant
CREATE UNIQUE INDEX IF NOT EXISTS subjects_tenant_name_unique
  ON public.subjects (tenant_id, LOWER(name));

COMMENT ON TABLE public.subjects IS
  'Disciplinas por vertical (tenant). Index subjects_tenant_name_unique garante ausência de duplicatas case-insensitive por tenant.';
