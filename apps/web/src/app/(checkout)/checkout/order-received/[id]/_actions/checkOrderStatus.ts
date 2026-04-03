'use server';

import { createServiceClient } from '@/lib/supabase/service';

export interface OrderStatusResult {
  status: 'pending' | 'active' | 'expired' | 'not_found';
  tenantId?: string;
}

/**
 * Polls the subscription status for the order-received page.
 * Validates the order_key to prevent enumeration attacks.
 * Only returns status — no sensitive data exposed.
 */
export async function checkOrderStatus(
  id: string,
  key: string,
): Promise<OrderStatusResult> {
  if (!id || !key) return { status: 'not_found' };

  const service = createServiceClient();
  const { data } = await service
    .from('billing_subscriptions')
    .select('status, tenant_id, order_key')
    .eq('id', id)
    .maybeSingle();

  if (!data || data.order_key !== key) return { status: 'not_found' };

  const status = (data.status as string) === 'active' ? 'active'
    : (data.status as string) === 'expired'  ? 'expired'
    : 'pending';

  return { status, tenantId: data.tenant_id ?? undefined };
}
