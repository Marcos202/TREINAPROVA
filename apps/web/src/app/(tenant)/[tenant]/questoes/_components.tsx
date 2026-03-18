"use client";

import { useState } from "react";
import { seedQuestions } from "./_actions";

const DIFFICULTY_MAP: Record<string, { label: string; className: string }> = {
  easy: {
    label: "Fácil",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  medium: {
    label: "Médio",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  hard: {
    label: "Difícil",
    className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

interface Question {
  id: string;
  text: string;
  difficulty: string;
  options: Record<string, string>;
  correct_option: string;
  created_at: string;
}

export function SeedButton({ tenant }: { tenant: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSeed = async () => {
    setLoading(true);
    setMessage("");
    const result = await seedQuestions(tenant);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Questões de teste inseridas com sucesso!");
      // Reload to fetch new data
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {loading ? "Inserindo..." : "Inserir Questões de Teste"}
      </button>
      {message && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar questão..."
      className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600"
    />
  );
}

export function QuestionList({ questions: initialQuestions }: { questions: Question[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialQuestions.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SearchBar value={search} onChange={setSearch} />

      <div className="space-y-3 mt-6">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center min-h-[180px] bg-white dark:bg-slate-950">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Nenhuma questão encontrada para esta área.
            </p>
          </div>
        ) : (
          filtered.map((question, index) => {
            const diff = DIFFICULTY_MAP[question.difficulty] || DIFFICULTY_MAP.easy;
            const options = question.options as Record<string, string>;

            return (
              <div
                key={question.id}
                className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-white dark:bg-slate-950"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                    <span className="text-slate-400 dark:text-slate-500 mr-2">
                      {String(index + 1).padStart(2, "0")}.
                    </span>
                    {question.text}
                  </p>
                  <span
                    className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${diff.className}`}
                  >
                    {diff.label}
                  </span>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(options).map(([key, value]) => {
                    const isCorrect = key === question.correct_option;
                    return (
                      <div
                        key={key}
                        className={`text-xs px-3 py-2 rounded-md border ${
                          isCorrect
                            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                            : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className="font-semibold uppercase mr-1.5">{key})</span>
                        {value}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
