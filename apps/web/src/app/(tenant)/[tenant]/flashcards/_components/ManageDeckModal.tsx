'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { CreateFlashcardModal, type Subject, type FlashcardInitialData } from './CreateFlashcardModal';
import {
  getPersonalFlashcardsForDeck,
  type PersonalFlashcardItem,
} from '../_actions/getPersonalFlashcardsForDeck';
import { deleteUserFlashcard } from '../_actions/deleteUserFlashcard';

// ── ManageDeckModal ────────────────────────────────────────────────────────────
//
// Shows the list of individual personal flashcards inside a deck (grouped by
// subject). Each card gets a pencil-edit button that opens CreateFlashcardModal
// in edit mode.
// ─────────────────────────────────────────────────────────────────────────────

interface TenantTheme {
  accent: string;
  accentGradient: string;
}

interface Props {
  tenant: string;
  subjectId: string | null;
  subjectName: string;
  theme: TenantTheme;
  subjects: Subject[];
  onClose: () => void;
  onRefresh: () => void;
}

// Strip HTML tags for a plain-text preview in the list row
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '(sem texto)';
}

export function ManageDeckModal({
  tenant,
  subjectId,
  subjectName,
  theme,
  subjects,
  onClose,
  onRefresh,
}: Props) {
  const [cards, setCards]               = useState<PersonalFlashcardItem[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [editTarget, setEditTarget]     = useState<FlashcardInitialData | null>(null);
  /** ID of the card awaiting delete confirmation (two-step UX) */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // Fetch the individual cards for this deck on mount
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getPersonalFlashcardsForDeck(tenant, subjectId).then((result) => {
      if (!cancelled) {
        setCards(result);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [tenant, subjectId]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // After a card is edited successfully: refresh the list and notify parent
  function handleEdited() {
    setEditTarget(null);
    onRefresh();
    // Re-fetch the list so edits are reflected immediately
    getPersonalFlashcardsForDeck(tenant, subjectId).then(setCards);
  }

  // Two-step delete handler
  const handleDelete = useCallback(
    async (id: string) => {
      if (confirmDeleteId !== id) {
        // First click: show confirmation
        setConfirmDeleteId(id);
        return;
      }
      // Second click: confirmed — execute delete
      setIsDeleting(true);
      const result = await deleteUserFlashcard(id, tenant);
      setIsDeleting(false);
      setConfirmDeleteId(null);

      if (!result.success) {
        toast.error(result.error ?? 'Erro ao deletar card.');
        return;
      }

      toast.success('Flashcard deletado.');
      onRefresh();
      // Remove from local list immediately (optimistic)
      setCards((prev) => prev.filter((c) => c.id !== id));
    },
    [confirmDeleteId, tenant, onRefresh]
  );

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={`Gerenciar baralho: ${subjectName}`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onClick={onClose}
        />

        {/* ── Sheet / Dialog ── */}
        <div
          className="
            relative z-10 w-full bg-white shadow-2xl
            rounded-t-3xl
            sm:rounded-3xl sm:max-w-lg sm:mx-4
            flex flex-col
            max-h-[88dvh] sm:max-h-[82dvh]
            overflow-hidden
          "
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-slate-900 truncate">
                {subjectName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isLoading
                  ? 'Carregando cards...'
                  : `${cards.length} card${cards.length === 1 ? '' : 's'} pessoal${cards.length === 1 ? '' : 'is'}`}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="ml-3 flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center
                text-slate-500 hover:bg-slate-200 hover:text-slate-800
                active:scale-95 transition-all duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              /* Skeleton */
              <div className="px-6 py-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">Nenhum card encontrado</p>
              </div>
            ) : (
              <ul className="px-4 py-4 space-y-2">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl
                      bg-slate-50 border border-slate-100
                      hover:border-slate-200 transition-colors duration-150"
                  >
                    {/* Front preview (plain text, truncated) */}
                    <p className="flex-1 min-w-0 text-sm text-slate-700 truncate">
                      {stripHtml(card.front)}
                    </p>

                    {confirmDeleteId === card.id ? (
                      /* ── Two-step confirmation UI ── */
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <span className="text-[11px] text-red-500 font-medium whitespace-nowrap">
                          Deletar?
                        </span>
                        <button
                          onClick={() => handleDelete(card.id)}
                          disabled={isDeleting}
                          title="Confirmar exclusão"
                          className="h-7 px-2 rounded-lg text-[11px] font-semibold
                            bg-red-500 text-white hover:bg-red-600
                            active:scale-95 transition-all duration-150
                            disabled:opacity-50"
                        >
                          {isDeleting ? '...' : 'Sim'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting}
                          title="Cancelar"
                          className="h-7 px-2 rounded-lg text-[11px] font-semibold
                            bg-slate-200 text-slate-600 hover:bg-slate-300
                            active:scale-95 transition-all duration-150"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      /* ── Normal action buttons ── */
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() =>
                            setEditTarget({
                              id: card.id,
                              subjectId: card.subjectId,
                              front: card.front,
                              back: card.back,
                            })
                          }
                          title="Editar card"
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                            text-slate-400 hover:text-slate-700
                            hover:bg-white border border-transparent hover:border-slate-200
                            active:scale-95 transition-all duration-150"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        {/* Delete button (first click = arm confirmation) */}
                        <button
                          onClick={() => handleDelete(card.id)}
                          title="Deletar card"
                          className="w-8 h-8 rounded-lg flex items-center justify-center
                            text-slate-300 hover:text-red-500
                            hover:bg-red-50 border border-transparent hover:border-red-100
                            active:scale-95 transition-all duration-150"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit modal (stacked on top of manage modal) ── */}
      {editTarget && (
        <CreateFlashcardModal
          tenant={tenant}
          theme={theme}
          subjects={subjects}
          initialData={editTarget}
          onClose={() => setEditTarget(null)}
          onCreated={handleEdited}
        />
      )}
    </>
  );
}
