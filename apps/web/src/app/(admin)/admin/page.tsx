import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const revalidate = 0; // Disable caching to always get fresh counts

export default async function AdminDashboard() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        }
    );

    // Total Alunos (is_admin != true)
    const { count: countTotalAlunos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('is_admin', true);

    // Alunos Pagantes
    const { count: countPagantes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium');

    // Total Questões
    const { count: countQuestoes } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

    // Distribuição por categoria nas questões
    const categories = ['med', 'oab', 'enem', 'vestibulares'];
    const rawDist = await Promise.all(
        categories.map(async (cat) => {
            const { count } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', cat);
            return { category: cat.toUpperCase(), count: count || 0 };
        })
    );

    const totalDistCount = rawDist.reduce((acc, curr) => acc + curr.count, 0) || 1; // avoid division by zero

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Visão Geral da Plataforma</h1>
                <p className="text-zinc-500 mt-1">Bem-vindo ao centro de comando. Aqui você gerencia conteúdos e seus alunos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="text-sm font-medium text-zinc-500 mb-4">Total de Alunos</div>
                    <div className="text-3xl font-bold text-zinc-900">{countTotalAlunos || 0}</div>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="text-sm font-medium text-zinc-500 mb-4">Alunos Pagantes</div>
                    <div className="text-3xl font-bold text-zinc-900">{countPagantes || 0}</div>
                </div>

                {/* Card 3 */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="text-sm font-medium text-zinc-500 mb-4">Total de Questões</div>
                    <div className="text-3xl font-bold text-zinc-900">{countQuestoes || 0}</div>
                </div>

                {/* Card 4 - Distribuicao Simplificada */}
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col justify-between row-span-2 lg:row-span-1">
                    <div className="text-sm font-medium text-zinc-500 mb-4">Métricas por Categoria</div>
                    <div className="space-y-3">
                        {rawDist.map((item) => {
                            const percentage = Math.round((item.count / totalDistCount) * 100);
                            return (
                                <div key={item.category} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-zinc-700">{item.category}</span>
                                        <span className="text-zinc-500">{item.count} q ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-zinc-800`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Exemplo de uma secao inferior vazia pra balancear o design Minimalista Linear. */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100">
                    <h3 className="text-base font-medium text-zinc-900">Atividade Recente</h3>
                </div>
                <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-500">
                    <svg className="w-12 h-12 text-zinc-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Os logs de atividade aparecerão aqui em breve.</p>
                </div>
            </div>
        </div>
    );
}
