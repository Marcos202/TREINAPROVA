import { createClient } from "@/lib/supabase/server";
import { TENANT_LABELS } from "@/config/tenants";
import { QuestionList, SeedButton } from "./_components";

export default async function QuestoesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenant = resolvedParams.tenant;
  const label = TENANT_LABELS[tenant] || tenant.toUpperCase();

  const supabase = await createClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("tenant_id", tenant)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Banco de Questões
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {label} — {questions?.length ?? 0} questão(ões) cadastrada(s)
          </p>
        </div>
        <SeedButton tenant={tenant} />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10">
          <p className="text-xs text-red-600 dark:text-red-400">
            Erro ao carregar questões: {error.message}
          </p>
        </div>
      )}

      {/* Question list */}
      <QuestionList questions={questions ?? []} />
    </div>
  );
}
