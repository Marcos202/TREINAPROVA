import { TENANT_THEME, VALID_TENANTS } from "@/config/tenants";
import { notFound } from "next/navigation";

export default async function PlanoPage({
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Plano de Aprovação</h1>
            <p className="text-slate-500 max-w-md">
                Estamos preparando o seu plano personalizado. Em breve você terá acesso a cronogramas e metas exclusivas.
            </p>
        </div>
    );
}
