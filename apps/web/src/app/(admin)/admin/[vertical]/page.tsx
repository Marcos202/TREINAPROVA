import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import Link from 'next/link';

interface Props {
  params: Promise<{ vertical: string }>;
}

export async function generateStaticParams() {
  return VALID_TENANTS.map((vertical) => ({ vertical }));
}

export default async function VerticalDashboardPage({ params }: Props) {
  const { vertical } = await params;

  if (!VALID_TENANTS.includes(vertical)) notFound();

  const label = TENANT_LABELS[vertical] ?? vertical;

  const resources = [
    { href: `/admin/${vertical}/questoes`, label: 'Questões', description: 'Gerencie o banco de questões' },
    { href: `/admin/${vertical}/disciplinas`, label: 'Disciplinas', description: 'Gerencie as disciplinas' },
    { href: `/admin/${vertical}/bancas`, label: 'Bancas', description: 'Gerencie as bancas examinadoras' },
    { href: `/admin/${vertical}/orgaos`, label: 'Órgãos', description: 'Gerencie órgãos e instituições' },
    { href: `/admin/${vertical}/provas`, label: 'Provas', description: 'Gerencie provas e exames' },
    { href: `/admin/${vertical}/simulados`, label: 'Simulados', description: 'Gerencie simulados' },
    { href: `/admin/${vertical}/cards`, label: 'Cards', description: 'Gerencie cards de conteúdo' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{label}</h1>
        <p className="text-sm text-zinc-500 mt-1">Painel da vertical <strong>{label}</strong>.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group block"
          >
            <p className="font-semibold text-zinc-900 group-hover:text-blue-700 transition-colors">{r.label}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{r.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
