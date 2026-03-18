"use client";

import { VALID_TENANTS, TENANT_LABELS } from "@/config/tenants";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TENANT_ICONS: Record<string, string> = {
  med: "🩺",
  oab: "⚖️",
  enem: "📚",
  vestibulares: "🎓",
};

export default function AlunoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }: { data: any }) => {
      if (data.session?.user) {
        setUser(data.session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        router.push("/login");
      } else if (event === 'INITIAL_SESSION' && !session) {
        router.push("/login");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Treina Prova
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Selecione sua área de estudo para começar
          </p>
        </div>

        {/* Auth status */}
        <div className="border border-slate-200 rounded-lg p-5 bg-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {user.email}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Sessão ativa
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 rounded-md px-3 py-1.5"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Tenant grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VALID_TENANTS.map((tenant) => {
            const label = TENANT_LABELS[tenant] || tenant.toUpperCase();
            const icon = TENANT_ICONS[tenant] || "📖";

            return (
              <a
                key={tenant}
                href={`/${tenant}`}
                className="group flex items-center gap-4 border border-slate-200 rounded-lg px-5 py-5 bg-white hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg leading-none">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Banco de questões e simulados
                  </p>
                </div>
                <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-sm">
                  →
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
