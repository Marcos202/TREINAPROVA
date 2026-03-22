export const VALID_TENANTS = ['med', 'oab', 'enem', 'vestibulares'];

export const TENANT_LABELS: Record<string, string> = {
  med: 'Medicina',
  oab: 'Exame da Ordem (OAB)',
  enem: 'ENEM',
  vestibulares: 'Vestibulares',
};

// Mapa slug → valor na coluna `vertical` da tabela user_plans
export const TENANT_VERTICAL_MAP: Record<string, string> = {
  med: 'medicina',
  oab: 'oab',
  enem: 'enem',
  vestibulares: 'vestibular',
};

// Classes Tailwind completas por vertical (necessário para JIT detection)
export const TENANT_ACCENT_COLORS: Record<string, string> = {
  med: 'bg-blue-900 hover:bg-blue-800',
  oab: 'bg-red-900 hover:bg-red-800',
  enem: 'bg-green-900 hover:bg-green-800',
  vestibulares: 'bg-purple-900 hover:bg-purple-800',
};
