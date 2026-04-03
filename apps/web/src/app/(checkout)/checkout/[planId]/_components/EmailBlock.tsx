'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CheckoutFormInput } from '@/lib/billing/checkoutSchema';

interface EmailBlockProps {
  register: UseFormRegister<CheckoutFormInput>;
  errors:   FieldErrors<CheckoutFormInput>;
}

const labelClass = 'block text-[12px] font-semibold text-slate-600 mb-1.5';

export default function EmailBlock({ register, errors }: EmailBlockProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h3 className="text-[14px] font-bold text-slate-800">E-mail para acesso ao produto</h3>
      </div>

      <div>
        <label className={labelClass}>E-mail</label>
        <input
          {...register('email')}
          type="email"
          disabled
          className="h-11 px-3.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-500 cursor-not-allowed"
        />
        {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>}
        <p className="mt-1.5 text-[11px] text-slate-400">O acesso ao produto será liberado neste e-mail.</p>
      </div>
    </div>
  );
}
