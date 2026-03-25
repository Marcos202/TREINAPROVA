import { createClient } from "@/lib/supabase/server";
import { TENANT_THEME, VALID_TENANTS } from "@/config/tenants";
import { notFound } from "next/navigation";
import { TestBuilderPage } from "./_components/TestBuilderPage";
import { RightSidebar } from "../_components/RightSidebar";

export default async function QuestoesPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  if (!VALID_TENANTS.includes(tenant)) notFound();

  const theme = TENANT_THEME[tenant] ?? TENANT_THEME["med"];
  const supabase = await createClient();

  // ── Fetch subjects + question counts in parallel ──────────────────────────
  const [{ data: subjects }, { data: countData }] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, name")
      .eq("tenant_id", tenant)
      .order("name"),

    // Materialized view criada na migration 00005.
    // Se não existir, retorna erro silencioso → countData = null → counts = 0.
    supabase
      .from("subject_question_counts")
      .select("subject_id, question_count"),
  ]);

  // ── Merge counts into subjects ────────────────────────────────────────────
  const countMap = new Map(
    (countData ?? []).map((c: { subject_id: string; question_count: number }) => [
      c.subject_id,
      Number(c.question_count) || 0,
    ])
  );

  // Se a view não existir, fazer fallback buscando questões do tenant
  let resolvedCountMap = countMap;
  if (!countData) {
    const { data: fallbackCounts } = await supabase
      .from("questions")
      .select("subject_id")
      .eq("tenant_id", tenant);

    const fb = new Map<string, number>();
    for (const q of fallbackCounts ?? []) {
      fb.set(q.subject_id, (fb.get(q.subject_id) ?? 0) + 1);
    }
    resolvedCountMap = fb;
  }

  const subjectsWithCounts = (subjects ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    question_count: resolvedCountMap.get(s.id) ?? 0,
  }));

  const totalCount = subjectsWithCounts.reduce(
    (sum, s) => sum + s.question_count,
    0
  );

  // ── Fetch subcategories per subject (top 5 most common) ──────────────────
  // Limitamos a 300 registros para não sobrecarregar; suficiente para pills visuais.
  const { data: subcatRows } = await supabase
    .from("questions")
    .select("subject_id, subcategories")
    .eq("tenant_id", tenant)
    .not("subcategories", "eq", "[]")
    .limit(300);

  // Aggregate: subject_id → Set<subcategory>
  const subcatMap = new Map<string, Set<string>>();
  for (const row of subcatRows ?? []) {
    const subs: string[] = Array.isArray(row.subcategories)
      ? row.subcategories
      : [];
    if (!subcatMap.has(row.subject_id)) subcatMap.set(row.subject_id, new Set());
    subs.forEach((s) => subcatMap.get(row.subject_id)!.add(s));
  }

  const subjectsWithSubcats = subjectsWithCounts.map((s) => ({
    ...s,
    subcategories: [...(subcatMap.get(s.id) ?? [])].slice(0, 5),
  }));

  return (
    /* ── Layout 3 colunas idêntico ao Dashboard ── */
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

      {/* Coluna central — Apenas estrutural */}
      <div className="xl:col-span-9 flex flex-col gap-8">
        {/* Inner Card Branco */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/60 flex flex-col gap-6 w-full">
          <TestBuilderPage
            tenant={tenant}
            theme={theme}
            subjects={subjectsWithSubcats}
            totalQuestionCount={totalCount}
          />
        </div>
      </div>

      {/* Coluna direita — puramente estrutural */}
      <div className="xl:col-span-3 flex flex-col gap-8">
        <RightSidebar
          tenant={tenant}
          theme={theme}
          showSchedule={false}
        />
      </div>

    </div>
  );
}

