'use client';

import { useState } from 'react';
import { QuestionList } from './QuestionList';
import { QuestionForm } from './QuestionForm';
import type { Subject, QuestionRow } from './types';

type View = 'list' | 'form';

interface Props {
  tenant: string;
  tenantLabel: string;
  subjects: Subject[];
}

export function QuestionManager({ tenant, tenantLabel, subjects }: Props) {
  const [view, setView] = useState<View>('list');
  const [editingQuestion, setEditingQuestion] = useState<QuestionRow | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const isEditing = view === 'form' && editingQuestion !== null;

  function handleNewQuestion() {
    setEditingQuestion(null);
    setView('form');
  }

  function handleEdit(q: QuestionRow) {
    setEditingQuestion(q);
    setView('form');
  }

  function handleSuccess() {
    setListRefreshKey((k) => k + 1);
    setView('list');
    setEditingQuestion(null);
  }

  function handleCancel() {
    setView('list');
    setEditingQuestion(null);
  }

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb + title ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb — oculto no mobile para economizar espaço */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 mb-1 flex-wrap">
            <span>Banco de Questões</span>
            <span>/</span>
            <span className="text-zinc-700 font-medium">{tenantLabel}</span>
            {view === 'form' && (
              <>
                <span>/</span>
                <span className="text-zinc-700 font-medium">
                  {isEditing ? 'Editar Questão' : 'Nova Questão'}
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
            {view === 'list' ? tenantLabel : isEditing ? 'Editar Questão' : 'Nova Questão'}
          </h1>
          {view === 'list' && (
            <p className="hidden sm:block text-sm text-zinc-500 mt-1">
              Gerencie questões da vertical <strong>{tenantLabel}</strong>.
            </p>
          )}
        </div>

        <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap">
          {tenant}
        </span>
      </div>

      {/* ── View: List ── */}
      {view === 'list' && (
        <QuestionList
          tenant={tenant}
          subjects={subjects}
          refreshKey={listRefreshKey}
          onNew={handleNewQuestion}
          onEdit={handleEdit}
        />
      )}

      {/* ── View: Form ── */}
      {view === 'form' && (
        <div className="space-y-4">
          {/* Back navigation */}
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para a lista
          </button>

          {/* Form card */}
          <QuestionForm
            key={editingQuestion?.id ?? 'new'}
            tenant={tenant}
            subjects={subjects}
            initialData={editingQuestion ?? undefined}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}
