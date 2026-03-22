-- =============================================================================
-- Migration 00006: RLS UPDATE + DELETE policies
-- Root cause fix: questions e subjects não tinham políticas de UPDATE/DELETE,
-- causando falha silenciosa (0 rows affected, error: null) nas edições.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- questions — UPDATE
-- ---------------------------------------------------------------------------
CREATE POLICY "Allow admin update questions" ON public.questions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- questions — DELETE
-- ---------------------------------------------------------------------------
CREATE POLICY "Allow admin delete questions" ON public.questions
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- subjects — UPDATE
-- ---------------------------------------------------------------------------
CREATE POLICY "Allow admin update subjects" ON public.subjects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- subjects — DELETE
-- ---------------------------------------------------------------------------
CREATE POLICY "Allow admin delete subjects" ON public.subjects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
