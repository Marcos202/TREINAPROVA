import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VALID_TENANTS, TENANT_THEME } from '@/config/tenants';
import { QuestionEngineUI } from './_components/QuestionEngineUI';

interface Props {
  params: Promise<{ tenant: string; session_id: string }>;
}

export default async function TreinoSessionPage({ params }: Props) {
  const { tenant, session_id } = await params;

  if (!VALID_TENANTS.includes(tenant)) notFound();

  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];
  const supabase = await createClient();

  // Auth check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect(`/${tenant}/login`);

  // Fetch question session (must belong to current user)
  const { data: qSession } = await supabase
    .from('question_sessions')
    .select('id, question_ids, current_index, total, correct_count, wrong_count')
    .eq('id', session_id)
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenant)
    .single();

  if (!qSession) notFound();

  // Fetch all questions in the session at once (preserves order in JS)
  const { data: questionsRaw } = await supabase
    .from('questions')
    .select('id, text, options, correct_option, difficulty, general_explanation, year, exam_board_id, institution_id, subcategories, subjects(name), exam_boards(name), institutions(name)')
    .in('id', qSession.question_ids as string[]);

  if (!questionsRaw?.length) notFound();

  // Re-order to match session order
  const questions = (qSession.question_ids as string[])
    .map((id) => questionsRaw.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => !!q);

  return (
    <QuestionEngineUI
      tenant={tenant}
      theme={theme}
      sessionId={session_id}
      userId={session.user.id}
      questions={questions}
      initialIndex={Math.min((qSession.current_index as number) ?? 0, questions.length - 1)}
    />
  );
}
