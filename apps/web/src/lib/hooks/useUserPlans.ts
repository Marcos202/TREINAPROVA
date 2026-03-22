'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TENANT_VERTICAL_MAP } from '@/config/tenants';

type Plan = { vertical: string; status: string };

export function useUserPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data: plansData } = await supabase
        .from('user_plans')
        .select('vertical, status')
        .eq('user_id', session.user.id)
        .eq('status', 'active');
      setPlans(plansData ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const hasAccess = (tenantSlug: string): boolean => {
    const vertical = TENANT_VERTICAL_MAP[tenantSlug];
    return plans.some((p) => p.vertical === vertical);
  };

  return { plans, loading, hasAccess };
}
