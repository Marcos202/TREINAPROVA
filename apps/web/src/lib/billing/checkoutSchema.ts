import { z } from 'zod';
import { validateCpfOrCnpj } from './cpfCnpj';

// ── Personal info ─────────────────────────────────────────────

export const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nome muito curto')
    .max(100, 'Nome muito longo')
    .refine((v) => v.trim().includes(' '), 'Informe nome e sobrenome'),
  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Celular inválido'),
  document: z
    .string()
    .min(11, 'CPF ou CNPJ obrigatório')
    .refine(validateCpfOrCnpj, 'CPF ou CNPJ inválido'),
});

// ── Email ─────────────────────────────────────────────────────

export const EmailSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

// ── Checkout (combined) ───────────────────────────────────────

export const CheckoutFormSchema = PersonalInfoSchema
  .merge(EmailSchema)
  .extend({
    paymentMethod: z.enum(['card', 'pix', 'boleto']),
    gatewayToken:  z.string().optional(),
    planId:        z.string().uuid(),
    installments:  z.number().int().min(1).max(12),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'card' && !data.gatewayToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Token de cartão ausente. Preencha os dados do cartão.',
        path: ['gatewayToken'],
      });
    }
  });

export type CheckoutFormInput = z.infer<typeof CheckoutFormSchema>;

// ── Error messages (rate limiting) ───────────────────────────

export const RATE_LIMIT_MESSAGES: Record<string, string> = {
  rate_limit:         'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
  too_many_declines:  'Cartão recusado repetidamente. Aguarde 24 horas ou use outro método.',
  ip_blocked:         'Muitas tentativas a partir deste dispositivo. Aguarde 1 hora.',
};
