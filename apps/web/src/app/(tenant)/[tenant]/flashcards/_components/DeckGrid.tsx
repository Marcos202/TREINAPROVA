'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeckCard } from './DeckCard';
import { SessionConfigModal } from './SessionConfigModal';
import { ManageDeckModal } from './ManageDeckModal';
import type { OfficialDeck, PersonalDeck } from '../_actions/getDecks';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantTheme {
  accent: string;
  accentLight: string;
  accentGradient: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Props {
  tenant: string;
  theme: TenantTheme;
  officialDecks: OfficialDeck[];
  personalDecks: PersonalDeck[];
  subjects: Subject[];
}

interface SelectedDeck {
  subjectId: string | null;
  subjectName: string;
  count: number;
  type: 'official' | 'personal';
}

// ── Grid layout ───────────────────────────────────────────────────────────────

const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5';

// ── Component ─────────────────────────────────────────────────────────────────

export function DeckGrid({ tenant, theme, officialDecks, personalDecks, subjects }: Props) {
  const router = useRouter();
  const [selectedDeck, setSelectedDeck] = useState<SelectedDeck | null>(null);
  const [manageDeck, setManageDeck]     = useState<SelectedDeck | null>(null);

  return (
    <>
      {/* ── Section: Treina Prova (official) ── */}
      <section className="space-y-4">
        <SectionHeader
          label="Treina Prova"
          count={officialDecks.length}
          unit="baralho"
        />

        {officialDecks.length > 0 ? (
          <div className={GRID}>
            {officialDecks.map((deck) => (
              <DeckCard
                key={deck.subjectId}
                subjectName={deck.subjectName}
                count={deck.count}
                type="official"
                accent={theme.accent}
                accentLight={theme.accentLight}
                onStudy={() =>
                  setSelectedDeck({ ...deck, type: 'official' })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="official"
            message="Nenhum baralho oficial disponível ainda."
            hint="Os flashcards das questões aparecerão aqui assim que forem cadastrados."
          />
        )}
      </section>

      {/* ── Section: Meus Flashcards (personal) ── */}
      <section className="space-y-4">
        <SectionHeader
          label="Meus Flashcards"
          count={personalDecks.length}
          unit="baralho"
          showCountOnEmpty
        />

        {personalDecks.length > 0 ? (
          <div className={GRID}>
            {personalDecks.map((deck, i) => (
              <DeckCard
                key={deck.subjectId ?? `personal-${i}`}
                subjectName={deck.subjectName}
                count={deck.count}
                type="personal"
                accent={theme.accent}
                accentLight={theme.accentLight}
                onStudy={() => setSelectedDeck({ ...deck, type: 'personal' })}
                onManage={() => setManageDeck({ ...deck, type: 'personal' })}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="personal"
            message="Você ainda não criou nenhum flashcard pessoal."
            hint={'Clique em "+ Criar Flashcard" para começar.'}
          />
        )}
      </section>

      {/* ── Session config modal ── */}
      {selectedDeck && (
        <SessionConfigModal
          tenant={tenant}
          deck={selectedDeck}
          theme={theme}
          onClose={() => setSelectedDeck(null)}
        />
      )}

      {/* ── Manage deck modal (personal cards only) ── */}
      {manageDeck && (
        <ManageDeckModal
          tenant={tenant}
          subjectId={manageDeck.subjectId}
          subjectName={manageDeck.subjectName}
          theme={{ accent: theme.accent, accentGradient: theme.accentGradient }}
          subjects={subjects}
          onClose={() => setManageDeck(null)}
          onRefresh={() => router.refresh()}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
  unit,
  showCountOnEmpty = false,
}: {
  label: string;
  count: number;
  unit: string;
  showCountOnEmpty?: boolean;
}) {
  const showCount = showCountOnEmpty || count > 0;
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </h2>
      <div className="h-px flex-1 bg-slate-200" />
      {showCount && (
        <span className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
          {count} {count === 1 ? unit : unit + 's'}
        </span>
      )}
    </div>
  );
}

function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: 'official' | 'personal';
  message: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        {icon === 'official' ? (
          <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9h20" /><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 14h4" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500">{message}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-[260px] leading-relaxed">{hint}</p>
    </div>
  );
}
