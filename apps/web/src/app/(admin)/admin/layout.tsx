import Link from 'next/link';
import { AdminSidebarNav } from './_components/AdminSidebarNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-zinc-950 flex flex-col h-full border-r border-zinc-800/60">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800/60 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
            <span className="text-white font-bold text-xs">TP</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight flex-1 min-w-0 truncate">
            TreinaPro
          </span>
          <span className="text-[9px] font-bold tracking-widest text-blue-400/70 uppercase bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/40">
            ADM
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
          <AdminSidebarNav />
        </div>

        {/* User Footer */}
        <div className="shrink-0 border-t border-zinc-800/60 p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700">
              <span className="text-zinc-200 text-[10px] font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-xs font-medium leading-none">Administrador</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">Sistema</p>
            </div>
          </div>
          <Link
            href="/aluno"
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors group"
          >
            <LogOutIcon className="w-3.5 h-3.5 shrink-0 group-hover:text-zinc-300" />
            Sair do Admin
          </Link>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-100/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400 font-medium">Admin</span>
            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-sm text-gray-800 font-semibold">Centro de Comando</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center ring-2 ring-zinc-700/50">
              <span className="text-white text-[10px] font-bold">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
