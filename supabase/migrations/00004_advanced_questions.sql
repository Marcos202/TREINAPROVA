-- Migration 00004: Advanced Question Metadata + Admin Policies

-- 1. Add advanced metadata columns to questions table
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS general_explanation TEXT,
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255),
  ADD COLUMN IF NOT EXISTS year INT,
  ADD COLUMN IF NOT EXISTS exam_board VARCHAR(255),
  ADD COLUMN IF NOT EXISTS institution VARCHAR(255),
  ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255);

-- NOTE: The `options` JSONB column already exists.
-- New expected structure per element: { "id": "A", "text": "...", "comment": "..." }
-- Previous structure { "a": "..." } is backwards-compatible at the DB level.

-- 2. Admin INSERT policy for questions
--    Admins (is_admin = true in profiles) can insert questions.
CREATE POLICY "Allow admin insert questions" ON public.questions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- 3. Admin INSERT policy for subjects
CREATE POLICY "Allow admin insert subjects" ON public.subjects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
