'use client';

import { useState } from 'react';
import { QuestionList } from './QuestionList';
import { QuestionForm } from './QuestionForm';
import { SuperImporter } from './SuperImporter';
import type { Subject, QuestionRow } from './types';

type View = 'list' | 'form' | 'import';

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

  function handleImportSuccess() {
    setListRefreshKey((k) => k + 1);
    setView('list');
  }

  const breadcrumbLabel =
    view === 'list' ? null
    : view === 'import' ? 'Importar com IA'
    : isEditing ? 'Editar Questão'
    : 'Nova Questão';

  const titleLabel =
    view === 'list' ? tenantLabel
    : view === 'import' ? 'Importar com IA'
    : isEditing ? 'Editar Questão'
    : 'Nova Questão';

  return (
    <div className="space-y-6">
      {/* ── Breadcrumb + title ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 mb-1 flex-wrap">
            <span>Banco de Questões</span>
            <span>/</span>
            <span className="text-zinc-700 font-medium">{tenantLabel}</span>
            {breadcrumbLabel && (
              <>
                <span>/</span>
                <span className="text-zinc-700 font-medium">{breadcrumbLabel}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">
            {titleLabel}
          </h1>
          {view === 'list' && (
            <p className="hidden sm:block text-sm text-zinc-500 mt-1">
              Gerencie questões da vertical <strong>{tenantLabel}</strong>.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {view === 'list' && (
            <button
              onClick={() => setView('import')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Importar com IA
            </button>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap">
            {tenant}
          </span>
        </div>
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
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para a lista
          </button>

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

      {/* ── View: Import ── */}
      {view === 'import' && (
        <div className="space-y-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para a lista
          </button>

          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            <SuperImporter
              tenant={tenant}
              subjects={subjects}
              onSuccess={handleImportSuccess}
            />
          </div>
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

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
