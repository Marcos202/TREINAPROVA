-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create subjects (Disciplinas/Matérias)
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and Create Read Policy
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.subjects FOR SELECT TO authenticated USING (true);


-- 2. Create questions (Banco de Questões)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(50) NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option VARCHAR(255) NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and Create Read Policy
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.questions FOR SELECT TO authenticated USING (true);


-- 3. Create exams (Simulados estruturados)
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and Create Read Policy
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.exams FOR SELECT TO authenticated USING (true);
