import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TENANT_THEME, VALID_TENANTS } from '@/config/tenants';
import { getOfficialDecks, getPersonalDecks } from './_actions/getDecks';
import { DeckGrid } from './_components/DeckGrid';
import { CreateFlashcardButton } from './_components/CreateFlashcardButton';

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  if (!VALID_TENANTS.includes(tenant)) notFound();

  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

  // Parallel fetch — decks + subjects for the create modal
  const supabase = await createClient();
  const [officialDecks, personalDecks, subjectsResult] = await Promise.all([
    getOfficialDecks(tenant),
    getPersonalDecks(tenant),
    supabase
      .from('subjects')
      .select('id, name')
      .eq('tenant_id', tenant)
      .order('name'),
  ]);
  const subjects = (subjectsResult.data ?? []).map((s) => ({
    id: s.id as string,
    name: s.name as string,
  }));

  const totalCards =
    officialDecks.reduce((s, d) => s + d.count, 0) +
    personalDecks.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Flashcards
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCards > 0
              ? `${totalCards.toLocaleString('pt-BR')} card${totalCards === 1 ? '' : 's'} disponíveis para estudo`
              : 'Memorização espaçada — estude no ritmo certo.'}
          </p>
        </div>

        <CreateFlashcardButton
          tenant={tenant}
          theme={{ accent: theme.accent, accentGradient: theme.accentGradient }}
          subjects={subjects}
        />
      </div>

      {/* ── SM-2 info strip ─────────────────────────────────────────────────── */}
      {totalCards > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{
            backgroundColor: theme.accent + '08',
            borderColor: theme.accent + '28',
            color: theme.accent,
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="font-medium">
            Memorização espaçada ativa — cards difíceis aparecem com mais frequência.
          </span>
        </div>
      )}

      {/* ── Deck grids (client — handles modal state) ───────────────────────── */}
      <DeckGrid
        tenant={tenant}
        theme={{
          accent: theme.accent,
          accentLight: theme.accentLight,
          accentGradient: theme.accentGradient,
        }}
        officialDecks={officialDecks}
        personalDecks={personalDecks}
        subjects={subjects}
      />

    </div>
  );
}
