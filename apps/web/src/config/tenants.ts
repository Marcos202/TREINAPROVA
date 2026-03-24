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

// Theme colors per tenant — used for accents, gradients, sidebar highlights
export const TENANT_THEME: Record<string, {
  accent: string;        // primary accent hex
  accentLight: string;   // light variant for backgrounds
  accentGradient: string; // CSS gradient string
  sidebarBg: string;     // sidebar background class
  sidebarActive: string; // active item bg
  sidebarHover: string;  // hover item bg
  badge: string;         // badge/pill class
  ring: string;          // focus ring class
}> = {
  med: {
    accent: '#2563eb',
    accentLight: '#eff6ff',
    accentGradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
    sidebarBg: 'bg-slate-50',
    sidebarActive: 'bg-blue-50 text-blue-700',
    sidebarHover: 'hover:bg-blue-50/60 hover:text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'ring-blue-500',
  },
  oab: {
    accent: '#dc2626',
    accentLight: '#fef2f2',
    accentGradient: 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)',
    sidebarBg: 'bg-slate-50',
    sidebarActive: 'bg-red-50 text-red-700',
    sidebarHover: 'hover:bg-red-50/60 hover:text-red-600',
    badge: 'bg-red-100 text-red-700',
    ring: 'ring-red-500',
  },
  enem: {
    accent: '#16a34a',
    accentLight: '#f0fdf4',
    accentGradient: 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
    sidebarBg: 'bg-slate-50',
    sidebarActive: 'bg-emerald-50 text-emerald-700',
    sidebarHover: 'hover:bg-emerald-50/60 hover:text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'ring-emerald-500',
  },
  vestibulares: {
    accent: '#7c3aed',
    accentLight: '#f5f3ff',
    accentGradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%)',
    sidebarBg: 'bg-slate-50',
    sidebarActive: 'bg-violet-50 text-violet-700',
    sidebarHover: 'hover:bg-violet-50/60 hover:text-violet-600',
    badge: 'bg-violet-100 text-violet-700',
    ring: 'ring-violet-500',
  },
};

// Legacy — keeping compatibility
export const TENANT_ACCENT_COLORS: Record<string, string> = {
  med: 'bg-blue-900 hover:bg-blue-800',
  oab: 'bg-red-900 hover:bg-red-800',
  enem: 'bg-green-900 hover:bg-green-800',
  vestibulares: 'bg-purple-900 hover:bg-purple-800',
};
