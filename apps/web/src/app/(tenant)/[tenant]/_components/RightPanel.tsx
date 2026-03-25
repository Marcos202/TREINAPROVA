'use client';

/* ──────────────────────────────────────────────────────────────────────────────
   Mini Calendar – visual UI of current month
   ────────────────────────────────────────────────────────────────────────────── */

function MiniCalendar({ accent }: { accent: string }) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const todayDay = today.getDate();

    const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-semibold text-slate-700 capitalize">{monthName}</p>
                <div className="flex items-center gap-1">
                    <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                        <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
                        <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-1">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-semibold text-slate-400 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, i) => {
                    const isToday = day === todayDay;
                    return (
                        <div
                            key={i}
                            className={`
                flex items-center justify-center text-[11px] font-medium w-7 h-7 mx-auto rounded-full transition-colors cursor-default
                ${day === null ? '' : isToday
                                    ? 'text-white font-bold'
                                    : 'text-slate-600 hover:bg-slate-100'}
              `}
                            style={isToday ? { backgroundColor: accent } : {}}
                        >
                            {day ?? ''}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Schedule Card item
   ────────────────────────────────────────────────────────────────────────────── */

function ScheduleCard({
    date,
    title,
    subject,
    time,
    badgeColor,
}: {
    date: string;
    title: string;
    subject: string;
    time: string;
    badgeColor: string;
}) {
    return (
        <div className="rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-shadow cursor-default">
            <div
                className="inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: badgeColor + '18', color: badgeColor }}
            >
                {date}
            </div>
            <p className="text-[12px] font-semibold text-slate-800 leading-tight">{title}</p>
            <p className="text-[10px] text-slate-400 mt-1">{subject} · {time}</p>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Timeline Activity item
   ────────────────────────────────────────────────────────────────────────────── */

function TimelineItem({
    text,
    bold,
    time,
    color,
    isLast,
}: {
    text: string;
    bold: string;
    time: string;
    color: string;
    isLast?: boolean;
}) {
    return (
        <div className="relative pl-5">
            {!isLast && (
                <div className="absolute left-[6px] top-4 bottom-0 w-px border-l-2 border-slate-200 border-dashed" />
            )}
            <div
                className="absolute left-0 top-[3px] w-3.5 h-3.5 rounded-full ring-2 ring-white flex items-center justify-center"
                style={{ backgroundColor: color }}
            >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
                <span className="font-semibold text-slate-800">{bold}</span>{' '}{text}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 mb-3">{time}</p>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Right Panel Component
   ────────────────────────────────────────────────────────────────────────────── */

interface RightPanelProps {
    tenant: string;
    theme: {
        accent: string;
        accentGradient: string;
        [key: string]: string;
    };
    userName?: string;
    userEmail?: string;
    /** Exibir a seção "Meu Cronograma". Padrão: true */
    showSchedule?: boolean;
}

export default function RightPanel({ theme, showSchedule = true }: RightPanelProps) {
    return (
        <aside className="flex flex-col bg-white rounded-2xl border border-slate-200/60">
            <div className="flex flex-col gap-5 p-5">

                {/* ─── Calendário ────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl">
                    <MiniCalendar accent={theme.accent} />
                </div>

                {/* ─── Meu Cronograma (opcional) ─────────────────────────── */}
                {showSchedule && <div className="h-px bg-slate-100" />}
                {showSchedule && (
                    <>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-[13px] font-bold text-slate-900">Meu Cronograma</h3>
                                <button className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14" /><path d="M5 12h14" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <ScheduleCard date="15 Nov" title="Simulado Nacional" subject="Medicina" time="09:00 - 11:00" badgeColor={theme.accent} />
                                <ScheduleCard date="20 Nov" title="Revisão — Bloco A" subject="Medicina" time="14:00 - 15:30" badgeColor="#f59e0b" />
                                <ScheduleCard date="25 Nov" title="Estudo Dirigido" subject="Medicina" time="19:00 - 20:30" badgeColor="#10b981" />
                            </div>
                        </div>
                        <div className="h-px bg-slate-100" />
                    </>
                )}

                {/* ─── Atividades Recentes (Timeline) ────────────────────── */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[13px] font-bold text-slate-900">Atividades Recentes</h3>
                        <button className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="1.5" />
                                <circle cx="12" cy="12" r="1.5" />
                                <circle cx="12" cy="19" r="1.5" />
                            </svg>
                        </button>
                    </div>

                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                        Hoje
                    </p>

                    <div>
                        <TimelineItem
                            bold="Você resolveu"
                            text="10 questões de prática"
                            time="10:30"
                            color={theme.accent}
                        />
                        <TimelineItem
                            bold="Você iniciou"
                            text="um Simulado Nacional"
                            time="09:45"
                            color="#10b981"
                        />
                        <TimelineItem
                            bold="Você revisou"
                            text="questões marcadas"
                            time="09:10"
                            color="#f59e0b"
                        />
                        <TimelineItem
                            bold="Você fez login"
                            text="na plataforma"
                            time="09:00"
                            color="#8b5cf6"
                            isLast
                        />
                    </div>
                </div>

            </div>
        </aside>
    );
}
