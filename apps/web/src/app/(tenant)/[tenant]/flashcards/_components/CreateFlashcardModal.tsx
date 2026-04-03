'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { createUserFlashcard } from '../_actions/createUserFlashcard';
import { updateUserFlashcard } from '../_actions/updateUserFlashcard';
import { deleteOrphanedFlashcardImages } from '../_actions/deleteOrphanedFlashcardImages';
import { FLASHCARD_FRONT_LIMIT, FLASHCARD_BACK_LIMIT } from '@/lib/flashcard-sanitize';

// TipTap requires dynamic import (no SSR) because it accesses window
const FlashcardRichEditor = dynamic(
  () => import('./FlashcardRichEditor').then((m) => m.FlashcardRichEditor),
  { ssr: false, loading: () => <div className="h-40 rounded-xl bg-slate-100 animate-pulse" /> }
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
}

interface TenantTheme {
  accent: string;
  accentGradient: string;
}

/** When provided, the modal opens in "edit" mode pre-filled with existing data. */
export interface FlashcardInitialData {
  id: string;
  subjectId: string | null;
  front: string;
  back: string;
}

interface Props {
  tenant: string;
  theme: TenantTheme;
  subjects: Subject[];
  onClose: () => void;
  onCreated: () => void;
  /** Pass to open the modal in edit mode */
  initialData?: FlashcardInitialData;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateFlashcardModal({
  tenant,
  theme,
  subjects,
  onClose,
  onCreated,
  initialData,
}: Props) {
  const isEditMode = !!initialData;

  const [subjectId, setSubjectId]   = useState<string>(initialData?.subjectId ?? '');
  const [front, setFront]           = useState(initialData?.front ?? '');
  const [back, setBack]             = useState(initialData?.back ?? '');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Orphan-image garbage collection ──────────────────────────────────────
  // Tracks URLs uploaded during this modal session.
  // On unmount WITHOUT save → fire-and-forget delete (Cenário A).
  // On save success → mark as saved so cleanup is skipped (Cenário B).
  const uploadedUrlsRef = useRef<string[]>([]);
  const savedRef        = useRef(false);

  /** Callback passed to both FlashcardRichEditor instances */
  const handleImageUploaded = useCallback((url: string) => {
    uploadedUrlsRef.current.push(url);
  }, []);

  // Cleanup on unmount: delete any uploaded images that were never persisted
  useEffect(() => {
    return () => {
      if (!savedRef.current && uploadedUrlsRef.current.length > 0) {
        // Fire-and-forget — non-blocking, non-critical
        deleteOrphanedFlashcardImages(uploadedUrlsRef.current);
      }
    };
  }, []); // empty deps — only runs on unmount; refs always hold latest values
  // ─────────────────────────────────────────────────────────────────────────

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isLoading || showSuccess) return;
    setError(null);
    setIsLoading(true);

    const result = isEditMode
      ? await updateUserFlashcard({ id: initialData!.id, tenant, subjectId: subjectId || null, front, back })
      : await createUserFlashcard({ tenant, subjectId: subjectId || null, front, back });

    setIsLoading(false);

    if (!result.success) {
      // Rate-limit and server errors → toast (prominent, dismissable)
      if ('rateLimited' in result && result.rateLimited) {
        toast.warning(result.error ?? 'Limite de criação atingido. Aguarde alguns minutos.');
      } else {
        toast.error(result.error ?? 'Erro ao salvar. Tente novamente.');
      }
      setError(result.error ?? 'Erro desconhecido.');
      return;
    }

    // ── Success ──
    savedRef.current = true; // Prevent orphan-image cleanup on unmount

    // Cenário B: Delete uploaded images that were removed from the editor before saving
    const finalHtml  = front + back;
    const abandoned  = uploadedUrlsRef.current.filter((u) => !finalHtml.includes(u));
    if (abandoned.length) {
      deleteOrphanedFlashcardImages(abandoned); // fire-and-forget
    }

    setShowSuccess(true);
    toast.success(isEditMode ? 'Flashcard atualizado!' : 'Flashcard criado!');
    onCreated(); // triggers revalidation signal to parent

    successTimer.current = setTimeout(() => {
      onClose();
    }, 1400);
  }, [isEditMode, initialData, isLoading, showSuccess, tenant, subjectId, front, back, onCreated, onClose]);

  const canSave = front.trim() !== '' && front !== '<p></p>'
    && back.trim() !== '' && back !== '<p></p>'
    && !isLoading && !showSuccess;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-fc-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => !isLoading && onClose()}
      />

      {/* Sheet — slides up on mobile, centered dialog on sm+ */}
      <div
        className="
          relative z-10 w-full bg-white shadow-2xl
          rounded-t-3xl
          sm:rounded-3xl sm:max-w-2xl sm:mx-4
          flex flex-col
          max-h-[92dvh] sm:max-h-[90dvh]
          overflow-hidden
        "
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2
              id="create-fc-title"
              className="text-base font-bold text-slate-900"
            >
              {isEditMode ? 'Editar Flashcard' : 'Criar Flashcard'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode
                ? 'Salvar alterações neste card pessoal'
                : 'Adicionar à seção "Meus Flashcards"'}
            </p>
          </div>
          <button
            onClick={() => !isLoading && onClose()}
            aria-label="Fechar"
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center
              text-slate-500 hover:bg-slate-200 hover:text-slate-800
              active:scale-95 transition-all duration-150 flex-shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── Subject dropdown ── */}
          <div className="space-y-1.5">
            <label htmlFor="fc-subject" className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Disciplina <span className="normal-case font-normal text-slate-400">(opcional)</span>
            </label>
            <select
              id="fc-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={isLoading || showSuccess}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white
                text-sm text-slate-800 appearance-none
                focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                transition"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '16px',
                paddingRight: '36px',
              }}
            >
              <option value="">Sem disciplina</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Frente + Verso ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Frente */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex-shrink-0">
                  F
                </span>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Frente
                </label>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  — a pergunta
                </span>
              </div>
              <FlashcardRichEditor
                tenant={tenant}
                value={front}
                onChange={setFront}
                onImageUploaded={handleImageUploaded}
                placeholder="O que é a lei de Ohm?"
                minHeight={160}
                limit={FLASHCARD_FRONT_LIMIT}
              />
            </div>

            {/* Verso */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex-shrink-0">
                  V
                </span>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Verso
                </label>
                <span className="text-[10px] text-slate-400 font-normal normal-case">
                  — a resposta
                </span>
              </div>
              <FlashcardRichEditor
                tenant={tenant}
                value={back}
                onChange={setBack}
                onImageUploaded={handleImageUploaded}
                placeholder="V = R × I (tensão = resistência × corrente)"
                minHeight={160}
                limit={FLASHCARD_BACK_LIMIT}
              />
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={() => !isLoading && onClose()}
            disabled={isLoading || showSuccess}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600
              bg-slate-100 hover:bg-slate-200
              active:scale-[0.97] transition-all duration-150
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
              text-sm font-semibold text-white shadow-sm
              active:scale-[0.97] transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: showSuccess ? '#16a34a' : theme.accentGradient }}
          >
            {showSuccess ? (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {isEditMode ? 'Atualizado!' : 'Criado!'}
              </>
            ) : isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity=".25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M17 21v-8H7v8M7 3v5h8" />
                </svg>
                {isEditMode ? 'Salvar Alterações' : 'Salvar Flashcard'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
