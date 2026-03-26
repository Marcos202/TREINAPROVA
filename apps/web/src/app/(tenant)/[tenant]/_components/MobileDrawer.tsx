'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    {
        label: 'Dashboard', path: '', icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        )
    },
    {
        label: 'Banco de Questões', path: '/questoes', icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" />
            </svg>
        )
    },
    {
        label: 'Simulados', path: '/simulados', icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
        )
    },
    {
        label: 'Estatísticas', path: '/estatisticas', icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
        )
    },
    {
        label: 'Comunidade', path: '/comunidade', icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    },
];

interface MobileDrawerProps {
    tenant: string;
    tenantLabel: string;
    theme: { accent: string; accentGradient: string; sidebarActive: string; sidebarHover: string;[k: string]: string };
    userName: string;
    userHandle: string;
}

export default function MobileDrawer({ tenant, tenantLabel, theme, userName, userHandle }: MobileDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* ── Mobile Sticky Top Header (hidden on lg+) ─────────────── */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200/70 flex items-center justify-between px-4">
                {/* Logo + Tenant */}
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ background: theme.accentGradient }}
                    >
                        <span className="text-white font-bold text-[11px]">
                            {tenant.substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <span className="text-[14px] font-semibold text-slate-800">{tenantLabel}</span>
                </div>

                {/* Right side: bell + hamburger */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </button>
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </div>

                    {/* Hamburger */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center"
                        aria-label="Abrir menu"
                    >
                        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" x2="20" y1="6" y2="6" />
                            <line x1="4" x2="20" y1="12" y2="12" />
                            <line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* ── Overlay backdrop ─────────────────────────────────────── */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-[48] bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── Slide-in Drawer ──────────────────────────────────────── */}
            <div
                className={`
          lg:hidden fixed inset-y-0 left-0 z-[49] w-[280px] bg-white border-r border-slate-200/80
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                {/* Drawer header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ background: theme.accentGradient }}
                        >
                            <span className="text-white font-bold text-[11px]">{tenant.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                            <p className="text-[13px] font-semibold text-slate-900 leading-tight">{tenantLabel}</p>
                            <p className="text-[10px] text-slate-400">Treina Prova</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                {/* User info strip */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: theme.accentGradient }}
                    >
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{userName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{userHandle}</p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-2 flex flex-col gap-0.5">
                    <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Menu</p>
                    {NAV_ITEMS.map((item) => {
                        const fullHref = `/${tenant}${item.path}`;
                        const isActive =
                            item.path === ''
                                ? pathname === `/${tenant}` || pathname === `/${tenant}/`
                                : pathname.startsWith(`/${tenant}${item.path}`) ||
                                  (item.path === '/questoes' && pathname.startsWith(`/${tenant}/treino`));

                        return (
                            <a
                                key={item.path}
                                href={fullHref}
                                onClick={() => setIsOpen(false)}
                                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-medium transition-all duration-150
                  ${isActive ? theme.sidebarActive + ' shadow-sm' : 'text-slate-500 ' + theme.sidebarHover}
                `}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                                )}
                            </a>
                        );
                    })}
                </nav>

                {/* Promo card */}
                <div className="px-3 pb-2 flex-shrink-0">
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                        <p className="text-[13px] font-semibold text-slate-800 mb-1">Treina Prova Premium</p>
                        <p className="text-[11px] text-slate-500 mb-3">Desbloqueie estatísticas avançadas e simulados infinitos.</p>
                        <button
                            className="w-full py-2 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
                            style={{ background: theme.accentGradient }}
                        >
                            Fazer Upgrade
                        </button>
                    </div>
                </div>

                {/* Logout */}
                <div className="px-3 pb-4 flex-shrink-0">
                    <div className="h-px bg-slate-100 mb-2" />
                    <a
                        href="/aluno"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
                    >
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                        <span>Sair</span>
                    </a>
                </div>
            </div>
        </>
    );
}
