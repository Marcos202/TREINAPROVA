import { TENANT_THEME, VALID_TENANTS } from "@/config/tenants";
import { notFound } from "next/navigation";

export default async function FlashcardsPage({
    params,
}: {
    params: Promise<{ tenant: string }>;
}) {
    const { tenant } = await params;

    if (!VALID_TENANTS.includes(tenant)) notFound();

    const theme = TENANT_THEME[tenant] ?? TENANT_THEME["med"];

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm"
                style={{ background: theme.accentGradient }}
            >
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9h20" />
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M10 14h4" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Flashcards</h1>
            <p className="text-slate-500 max-w-md">
                A ferramenta definitiva para memorização espaçada. Estamos trabalhando para liberar este recurso o quanto antes!
            </p>
        </div>
    );
}
