"use client";

import { VALID_TENANTS } from "@/config/tenants";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AlunoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const displayIdentifier = userName || user.email;
  const initial = displayIdentifier ? displayIdentifier.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex h-screen bg-[#f3f6fa] font-sans text-slate-800 selection:bg-blue-200">

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] lg:w-[340px] transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between py-6 lg:py-8 px-5 border-r border-[#e5e9f0] bg-white lg:bg-white shadow-2xl lg:shadow-none`}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 mb-10 mt-2 lg:mt-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#3a5bcf]">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 uppercase">
              Treina Prova
            </span>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col gap-1.5">
            <NavItem
              active
              icon={<HomeIcon />}
              label="Área do aluno" />
            <NavItem
              icon={<UserIcon />}
              label="Meu Perfil" />
            <NavItem
              icon={<CartIcon />}
              label="Minhas Compras" />
            <NavItem
              icon={<CreditCardIcon />}
              label="Meus Pagamentos" />
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-slate-200/60 bg-white/50 hover:bg-white text-slate-600 hover:text-slate-900 transition-all shadow-sm font-medium text-[15px]"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-md">
              <MenuIcon className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Treina Prova
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#6a7b8e] flex items-center justify-center text-white font-medium text-xs ring-2 ring-white shadow-sm">
            {initial}
          </div>
        </header>

        {/* Scrollable Flow Area */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row scrollbar-hide">

          {/* Main Content Area */}
          <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:pb-24">

            {/* Welcome Hero Banner */}
            <div className="w-full relative overflow-hidden rounded-[20px] md:rounded-[24px] bg-white p-6 md:p-10 pb-8 md:pb-12 mb-6 md:mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex border border-white/50">
              <div className="z-10 max-w-lg">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#111827] mb-3 tracking-tight leading-tight">
                  {userName ? `Olá, ${userName.split(" ")[0]}. Pronto para avançar hoje?` : "Olá, pronto para avançar hoje?"}
                </h2>
                <p className="text-slate-600 text-[14px] md:text-[15px] mb-6 md:mb-8 leading-relaxed max-w-sm">
                  Aproveite 50% de desconto e acelere sua aprovação com a plataforma líder do Brasil.
                </p>
                <button className="bg-[#1a2333] text-white px-6 md:px-7 py-3 rounded-full font-medium shadow-md hover:bg-black transition-all hover:-translate-y-0.5 transform duration-200 text-sm md:text-base">
                  Garantir desconto
                </button>
              </div>

              {/* Illustration Container (Hidden on small mobile logic) */}
              <div className="hidden lg:block absolute right-[-40px] top-1/2 -translate-y-1/2 w-[340px] opacity-90 pointer-events-none">
                <div className="relative w-full aspect-[4/3]">
                  <div className="absolute bottom-4 right-16 w-56 h-16 bg-[#3a5bcf] rounded-md border border-[#2b449b] transform rotate-[-12deg] skew-x-[30deg] shadow-lg"></div>
                  <div className="absolute bottom-8 right-[52px] w-56 h-4 bg-white/90 rounded-sm transform rotate-[-12deg] skew-x-[30deg]"></div>

                  <div className="absolute bottom-16 right-16 w-56 h-12 bg-[#ff8675] rounded-md border border-[#db6e5f] transform rotate-[-12deg] skew-x-[30deg] shadow-lg"></div>
                  <div className="absolute bottom-20 right-[56px] w-56 h-4 bg-white/90 rounded-sm transform rotate-[-12deg] skew-x-[30deg]"></div>

                  <div className="absolute bottom-28 right-16 w-52 h-10 bg-gradient-to-br from-white to-slate-100 rounded-md border border-slate-200 transform rotate-[-12deg] skew-x-[30deg] shadow-lg flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-slate-200 mx-1"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 mx-1"></div>
                    <div className="w-8 h-8 rounded-full bg-[#1a2333] mx-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid 2x2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 w-full">
              {/* Medicina */}
              <CourseCard
                tenant="med"
                title="Medicina"
                description="Residência Médica e Revalida com o melhor banco de questões."
                info="10 Files"
                icon={<StethoscopeIcon className="w-6 h-6 md:w-8 md:h-8 stroke-[1.5]" />}
                gradient="bg-gradient-to-br from-[#2fc5ce] to-[#25a8b0]"
                border="border-teal-400/40"
                theme="dark"
              />
              {/* OAB */}
              <CourseCard
                tenant="oab"
                title="Exame da Ordem (OAB)"
                description="Aprovação na 1ª e 2ª fase com simulados exclusivos."
                info="16 Files"
                icon={<ScaleIcon className="w-6 h-6 md:w-8 md:h-8 stroke-[1.5]" />}
                gradient="bg-gradient-to-br from-[#c94b4b] to-[#b03a3a]"
                border="border-red-500/40"
                theme="dark"
              />
              {/* ENEM */}
              <CourseCard
                tenant="enem"
                title="ENEM"
                description="A base mais forte para o ENEM com métricas avançadas e TRI."
                info="Teacher: Treina Prova"
                icon={<BookOpenIcon className="w-6 h-6 md:w-8 md:h-8 stroke-[1.5]" />}
                gradient="bg-gradient-to-br from-[#3aa76d] to-[#2e8f5b]"
                border="border-green-500/40"
                theme="dark"
              />
              {/* Vestibulares */}
              <CourseCard
                tenant="vestibulares"
                title="Vestibulares"
                description="Preparação focada nas bancas mais concorridas do Brasil."
                info="Teacher: Treina Prova"
                icon={<GraduationCapIcon className="w-6 h-6 md:w-8 md:h-8 stroke-[1.5]" />}
                gradient="bg-gradient-to-br from-[#ff8773] to-[#ff6657]"
                border="border-red-400/40"
                theme="dark"
              />
            </div>

          </main>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-[340px] flex-shrink-0 bg-white lg:bg-white border-t lg:border-t-0 lg:border-l border-[#e5e9f0] flex flex-col py-8 px-4 sm:px-6 lg:px-8">

            {/* Profile - Hidden heavily on mobile as it's shown in header, but available on slightly larger tablets */}
            <div className="hidden lg:flex flex-col items-center mb-10">
              <div className="w-24 h-24 rounded-full bg-[#6a7b8e] shadow-md flex items-center justify-center text-4xl font-medium text-white mb-5 border-[3px] border-[#f3f6fa] ring-1 ring-slate-200">
                {initial}
              </div>
              <p className="text-[#111827] font-medium text-center text-lg break-all leading-tight">
                {displayIdentifier}
              </p>
            </div>

            {/* Calendar UI Mock */}
            <div className="mb-10 w-full px-1 max-w-sm mx-auto lg:max-w-none">
              <div className="flex items-center justify-between mb-5">
                <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
                  <ChevronLeft />
                </button>
                <span className="font-bold text-[15px] text-[#111827]">December 2026</span>
                <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
                  <ChevronRight />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-[13px]">
                {/* Days Header */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-[#6a7b8e] font-semibold">{d}</div>
                ))}

                {/* Previous month days */}
                {[27, 28].map(d => (
                  <div key={`p-${d}`} className="w-8 h-8 md:w-9 md:h-9 mx-auto flex items-center justify-center text-slate-400 font-medium">{d}</div>
                ))}

                {/* Current month days */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                  const isEvent1 = d === 7;
                  const isEvent2 = d === 19;
                  const isEvent3 = d === 29;

                  let baseClass = "w-8 h-8 md:w-9 md:h-9 mx-auto flex items-center justify-center rounded-full font-medium transition-all cursor-pointer ";

                  if (isEvent1) baseClass += "bg-[#ff8773] text-white shadow-md hover:opacity-90";
                  else if (isEvent2) baseClass += "bg-[#a68de7] text-white shadow-md hover:opacity-90";
                  else if (isEvent3) baseClass += "bg-[#6a7b8e] text-white shadow-md hover:opacity-90";
                  else baseClass += "text-[#111827] hover:bg-slate-200";

                  return (
                    <div key={d} className={baseClass}>
                      {d}
                    </div>
                  );
                })}
                {/* Next month days */}
                {[1, 2].map(d => (
                  <div key={`n-${d}`} className="w-8 h-8 md:w-9 md:h-9 mx-auto flex items-center justify-center text-slate-400 font-medium">{d}</div>
                ))}
              </div>
            </div>

            {/* Reminders List */}
            <div className="px-1 max-w-sm mx-auto lg:max-w-none w-full">
              <h3 className="font-bold text-[#111827] mb-5 tracking-tight text-[16px]">Reminders</h3>
              <div className="flex flex-col gap-4">
                <ReminderItem title="Simulado OAB 2ª Fase" date="12 Dec 2026, Friday" />
                <ReminderItem title="Gabarito ENEM Liberado" date="12 Dec 2026, Friday" />
                <ReminderItem title="Aula Ao Vivo - Redação" date="12 Dec 2026, Friday" />
                <ReminderItem title="Revisão Véspera Med" date="15 May 2026, Friday" />
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// Componentes Auxiliares
// ---------------------------

function NavItem({ active, icon, label }: { active?: boolean; icon: React.ReactNode; label: string }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all cursor-pointer font-medium text-[15px]
      ${active
          ? "bg-[#e2e7ef] text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          : "text-[#6a7b8e] hover:bg-slate-200/50 hover:text-slate-900"
        }`}
    >
      <span className={`flex items-center justify-center w-5 h-5 ${active ? "text-[#111827]" : "text-[#7a8ba1]"}`}>
        {icon}
      </span>
      {label}
    </a>
  );
}

function CourseCard({ tenant, title, description, info, icon, gradient, border, theme }:
  { tenant: string, title: string, description: string, info: string, icon: React.ReactNode, gradient: string, border: string, theme: 'dark' | 'light' }) {

  const textColor = theme === 'dark' ? 'text-white' : 'text-[#111827]';
  const descColor = theme === 'dark' ? 'text-white/80' : 'text-slate-500';
  const iconBg = theme === 'dark'
    ? 'bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
    : 'bg-[#f2f5f9] border border-slate-200';
  const btnBase = "w-full py-3.5 rounded-xl font-semibold text-[15px] transition-all duration-300 text-center backdrop-blur-md hover:-translate-y-0.5 shadow-sm";
  const btnStyle = theme === 'dark'
    ? "bg-white/20 text-white hover:bg-white/30 border border-white/20"
    : "bg-gradient-to-b from-white to-slate-50 border border-slate-200 text-slate-800 hover:shadow-md";

  return (
    <div className={`relative flex flex-col justify-between p-5 md:p-6 rounded-[20px] md:rounded-[24px] ${gradient} ${border} border shadow-sm group min-h-[220px] transition-transform duration-300 hover:scale-[1.01]`}>
      <div>
        <div className="flex items-start gap-4 mb-3">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg} ${textColor}`}>
            {icon}
          </div>
          <div className="pt-0.5 md:pt-1">
            <h3 className={`font-bold text-lg md:text-xl tracking-tight leading-tight ${textColor}`}>{title}</h3>
            <p className={`text-[13px] md:text-[14px] mt-1.5 leading-snug lg:pr-4 ${descColor}`}>
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 ml-1">
          <CalendarIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-white/70' : 'text-slate-400'}`} />
          <span className={`text-[12px] md:text-[13px] font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-500'}`}>
            {info}
          </span>
        </div>
      </div>

      <div className="mt-5 md:mt-6">
        <a href={`/${tenant}`} className={`block ${btnBase} ${btnStyle}`}>
          Acessar
        </a>
      </div>
    </div>
  );
}

function ReminderItem({ title, date }: { title: string, date: string }) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer bg-white lg:bg-transparent rounded-xl lg:rounded-none p-3 lg:p-0 shadow-sm lg:shadow-none border border-slate-100 lg:border-transparent">
      <div className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center flex-shrink-0 group-hover:border-slate-300 transition-colors">
        <BellIcon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-[14px] font-bold text-[#111827] leading-tight group-hover:text-[#3a5bcf] transition-colors">{title}</p>
        <p className="text-[12px] font-medium text-[#6a7b8e] mt-0.5">{date}</p>
      </div>
    </div>
  );
}

// ---------------------------
// Inline SVGs (Lucide React style)
// ---------------------------

const MenuIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);
const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
);
const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
);
const BellIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const StethoscopeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" /><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" /><circle cx="20" cy="10" r="2" /></svg>
);
const ScaleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></svg>
);
const BookOpenIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);
const GraduationCapIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.42 10.922a2 2 0 0 1-.019 3.837l-8.5 4.5a2 2 0 0 1-1.8 0l-8.5-4.5a2 2 0 0 1-.019-3.837l8.5-4.5a2 2 0 0 1 1.838 0Z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
);
const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m9 18 6-6-6-6" /></svg>
);
