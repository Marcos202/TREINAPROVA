'use client';

import { useState, useCallback } from 'react';
import { CreateFlashcardModal, type Subject } from './CreateFlashcardModal';

// ── CreateFlashcardButton ──────────────────────────────────────────────────────
//
// Client Component that:
//   1. Renders the "+ Criar Flashcard" button
//   2. Owns the modal open/close state
//   3. Calls router.refresh() after a successful creation so the Server
//      Component (page.tsx) re-fetches personal decks
//
// Placed in page.tsx header instead of the previous <button disabled>.
// ─────────────────────────────────────────────────────────────────────────────

import { useRouter } from 'next/navigation';

interface TenantTheme {
  accent: string;
  accentGradient: string;
}

interface Props {
  tenant: string;
  theme: TenantTheme;
  subjects: Subject[];
}

export function CreateFlashcardButton({ tenant, theme, subjects }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleCreated = useCallback(() => {
    // revalidatePath is called server-side in the action, but we also
    // call router.refresh() to trigger the client-side re-fetch of the
    // Server Component without a full page reload.
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
          text-sm font-semibold text-white shadow-sm
          hover:opacity-90 active:scale-[0.97]
          transition-all duration-150"
        style={{ background: theme.accentGradient }}
      >
        <svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Criar Flashcard
      </button>

      {isOpen && (
        <CreateFlashcardModal
          tenant={tenant}
          theme={theme}
          subjects={subjects}
          onClose={() => setIsOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
