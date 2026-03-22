import Link from 'next/link';
import { AdminSidebarNav } from './_components/AdminSidebarNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-950 text-zinc-300 flex flex-col justify-between border-r border-zinc-800">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-zinc-800">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center mr-3 font-bold text-zinc-950 text-xl tracking-tighter">
              TP
            </div>
            <span className="font-semibold text-white tracking-tight">TreinaPro</span>
            <span className="ml-2 text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">ADMIN</span>
          </div>

          <AdminSidebarNav />
        </div>

        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/aluno"
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-zinc-400 bg-zinc-900 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Sair do Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-sm font-medium text-zinc-500">Centro de Comando</h2>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
              AD
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-zinc-50 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
