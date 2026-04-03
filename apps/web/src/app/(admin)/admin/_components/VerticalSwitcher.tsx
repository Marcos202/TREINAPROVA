'use client'

import { usePathname, useRouter } from 'next/navigation'
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants'
import { useState } from 'react'

const VERTICAL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  med: { bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  oab: { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  enem: { bg: 'bg-orange-50 hover:bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  vestibulares: { bg: 'bg-violet-50 hover:bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
}

export function VerticalSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Extract current vertical from pathname: /admin/[vertical]/...
  const segments = pathname.split('/')
  const adminIndex = segments.indexOf('admin')
  const currentVertical = adminIndex !== -1 ? segments[adminIndex + 1] : null
  const activeVertical = VALID_TENANTS.includes(currentVertical as any) ? currentVertical : null

  const activeColors = activeVertical ? VERTICAL_COLORS[activeVertical] : null
  const activeLabel = activeVertical ? TENANT_LABELS[activeVertical as keyof typeof TENANT_LABELS] : 'Visão Global'

  function handleSelect(vertical: string | null) {
    setOpen(false)
    if (vertical === null) {
      router.push('/admin')
    } else {
      router.push(`/admin/${vertical}`)
    }
  }

  return (
    <div className="relative px-3 py-2">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
          activeColors
            ? `${activeColors.bg} ${activeColors.text} border-transparent`
            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
        }`}
      >
        {activeVertical && activeColors && (
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeColors.dot}`} />
        )}
        {!activeVertical && (
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-slate-400" />
        )}
        <span className="flex-1 text-left truncate">{activeLabel}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-3 right-3 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                !activeVertical
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Visão Global</span>
              {!activeVertical && <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </button>
            <div className="border-t border-slate-100" />
            {VALID_TENANTS.map((vertical) => {
              const colors = VERTICAL_COLORS[vertical]
              const label = TENANT_LABELS[vertical as keyof typeof TENANT_LABELS]
              const isActive = vertical === activeVertical
              return (
                <button
                  key={vertical}
                  onClick={() => handleSelect(vertical)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    isActive ? `${colors.bg} ${colors.text} font-medium` : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span>{label}</span>
                  {isActive && <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
