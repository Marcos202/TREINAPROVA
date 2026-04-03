'use client';

import { IMaskInput } from 'react-imask';
import type { UseFormRegister, FieldErrors, Control, Controller as ControllerType } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { CheckoutFormInput } from '@/lib/billing/checkoutSchema';

interface PersonalInfoBlockProps {
  register: UseFormRegister<CheckoutFormInput>;
  errors:   FieldErrors<CheckoutFormInput>;
  control:  Control<CheckoutFormInput>;
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

export default function PersonalInfoBlock({ register, errors, control }: PersonalInfoBlockProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className="text-[14px] font-bold text-slate-800">Informações Pessoais</h3>
      </div>

      {/* Nome completo */}
      <div>
        <label className={labelClass}>
          Nome completo <span className="text-red-500">*</span>
        </label>
        <input
          {...register('fullName')}
          type="text"
          placeholder="Digite seu nome completo"
          autoComplete="name"
          className={inputClass(!!errors.fullName)}
        />
        {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
      </div>

      {/* Celular + CPF/CNPJ */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            Celular <span className="text-red-500">*</span>
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <IMaskInput
                mask={[
                  { mask: '(00) 0000-0000' },
                  { mask: '(00) 00000-0000' },
                ]}
                value={field.value}
                onAccept={(v: string) => field.onChange(v)}
                placeholder="(11) 99999-9999"
                autoComplete="tel"
                className={inputClass(!!errors.phone)}
              />
            )}
          />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>

        <div>
          <label className={labelClass}>
            CPF / CNPJ <span className="text-red-500">*</span>
          </label>
          <Controller
            name="document"
            control={control}
            render={({ field }) => (
              <IMaskInput
                mask={[
                  { mask: '000.000.000-00' },
                  { mask: '00.000.000/0000-00' },
                ]}
                dispatch={(appended, dynamicMasked) => {
                  const number = (dynamicMasked.value + appended).replace(/\D/g, '');
                  return dynamicMasked.compiledMasks[number.length > 11 ? 1 : 0];
                }}
                value={field.value}
                onAccept={(v: string) => field.onChange(v)}
                placeholder="CPF ou CNPJ"
                className={inputClass(!!errors.document)}
              />
            )}
          />
          {errors.document && <p className={errorClass}>{errors.document.message}</p>}
        </div>
      </div>
    </div>
  );
}
