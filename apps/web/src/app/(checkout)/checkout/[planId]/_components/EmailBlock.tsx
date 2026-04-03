'use client';

import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import type { CheckoutFormInput } from '@/lib/billing/checkoutSchema';

interface EmailBlockProps {
  register: UseFormRegister<CheckoutFormInput>;
  errors:   FieldErrors<CheckoutFormInput>;
}

const inputClass = (hasError: boolean) =>
  `h-11 px-3.5 w-full bg-white border rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400
   focus:outline-none focus:ring-1 transition-all
   ${hasError
     ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
     : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
   }`;

const labelClass = 'block text-[12px] font-semibold text-slate-600 mb-1.5';
const errorClass = 'mt-1 text-[11px] text-red-500';

export default function EmailBlock({ register, errors }: EmailBlockProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h3 className="text-[14px] font-bold text-slate-800">E-mail para acesso ao produto</h3>
      </div>

      {/* E-mail */}
      <div>
        <label className={labelClass}>
          Digite seu e-mail <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          type="email"
          placeholder="seuemail@exemplo.com"
          autoComplete="email"
          className={inputClass(!!errors.email)}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Confirmar e-mail */}
      <div>
        <label className={labelClass}>
          Confirme o e-mail <span className="text-red-500">*</span>
        </label>
        <input
          {...register('emailConfirm')}
          type="email"
          placeholder="seuemail@exemplo.com"
          autoComplete="off"
          onPaste={(e) => e.preventDefault()}
          className={inputClass(!!errors.emailConfirm)}
        />
        {errors.emailConfirm && <p className={errorClass}>{errors.emailConfirm.message}</p>}
      </div>
    </div>
  );
}
