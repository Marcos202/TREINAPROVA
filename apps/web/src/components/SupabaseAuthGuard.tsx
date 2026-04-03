'use client'

import { useEffect, useRef } from 'react'
import { createClient, resetClient } from '@/lib/supabase/client'

/**
 * Detecta falhas de refresh token e limpa a sessão local imediatamente.
 *
 * Problema que resolve:
 *   Quando o Supabase tem um refresh token inválido/expirado nos cookies,
 *   o SDK fica tentando renovar em loop (centenas de POSTs a /auth/v1/token),
 *   batendo no rate limit e impedindo o login.
 *
 * Solução:
 *   Ao receber SIGNED_OUT (emitido pelo SDK após falha de refresh), chamamos
 *   signOut({ scope: 'local' }) para limpar cookies sem chamada de rede e
 *   resetamos o singleton para encerrar o timer interno de auto-refresh.
 */
export function SupabaseAuthGuard() {
  const isClearing = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT' && !isClearing.current) {
          isClearing.current = true
          // scope: 'local' — limpa apenas cookies/storage locais,
          // sem chamada de rede (não consome rate limit)
          await supabase.auth.signOut({ scope: 'local' })
          // Reseta o singleton para que a próxima página/componente
          // receba uma instância limpa sem timers de refresh pendentes
          resetClient()
          isClearing.current = false
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}
