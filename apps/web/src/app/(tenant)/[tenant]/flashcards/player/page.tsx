import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VALID_TENANTS, TENANT_THEME } from '@/config/tenants';
import { getSessionCards } from './_actions/getCards';
import { PlayerEngine } from './_components/PlayerEngine';

// ── FlashcardPlayerPage ────────────────────────────────────────────────────────
//
// Entry point for the flashcard player. Responsibilities:
//   1. Validate tenant
//   2. Auth check (redirect to login if unauthenticated)
//   3. Parse searchParams from SessionConfigModal
//   4. Fetch cards via getSessionCards (SM-2 aware, shuffled)
//   5. Render <PlayerEngine> (Client Component that owns all UI state)
//
// SearchParams contract (set by SessionConfigModal):
//   type    — 'official' | 'personal'
//   subject — UUID | 'all'
//   limit   — '20' | '50' | '100' | '0' (0 = no limit → 400)
//   mode    — 'pending' | 'all'
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{
    type?: string;
    subject?: string;
    limit?: string;
    mode?: string;
  }>;
}

export default async function FlashcardPlayerPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  if (!VALID_TENANTS.includes(tenant)) notFound();

  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

  // ── Auth ──
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect(`/${tenant}/login`);

  // ── Parse searchParams ──
  const sp = await searchParams;

  const type: 'official' | 'personal' =
    sp.type === 'personal' ? 'personal' : 'official';

  const subjectId: string | null =
    sp.subject && sp.subject !== 'all' ? sp.subject : null;

  const rawLimit = Number(sp.limit ?? '20');
  // limit=0 means "all" — cap at 400 to avoid accidental over-fetching
  const limit = rawLimit === 0 ? 400 : Math.max(1, rawLimit);

  const mode: 'pending' | 'all' =
    sp.mode === 'all' ? 'all' : 'pending';

  // ── Fetch cards ──
  const cards = await getSessionCards({
    tenant,
    userId: session.user.id,
    subjectId,
    limit,
    mode,
    type,
  });

  // ── Empty state: redirect back with a hint ──
  if (cards.length === 0) {
    redirect(`/${tenant}/flashcards?empty=1`);
  }

  // ── Render player ──
  return (
    <PlayerEngine
      cards={cards}
      tenant={tenant}
      theme={{
        accent: theme.accent,
        accentGradient: theme.accentGradient,
      }}
    />
  );
}
