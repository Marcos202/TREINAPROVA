'use client';

import { useRouter } from 'next/navigation';

export default function PublicHeader() {
  const router = useRouter();

  return (
    <header className="w-full h-14 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Voltar
      </button>

      <div className="h-4 w-px bg-slate-200" />

      <span className="text-[13px] font-bold text-slate-800 tracking-tight">
        TREINA PROVA
      </span>
    </header>
  );
}
