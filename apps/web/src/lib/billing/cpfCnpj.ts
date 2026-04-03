/**
 * CPF and CNPJ validation — digit verification algorithm.
 * No external dependencies. Used in Zod refinements.
 */

/** Strip all non-digit characters */
function digits(val: string): string {
  return val.replace(/\D/g, '');
}

/** Returns true if all characters are the same digit (invalid CPF/CNPJ) */
function allSameDigit(s: string): boolean {
  return s.split('').every((c) => c === s[0]);
}

export function validateCpf(raw: string): boolean {
  const d = digits(raw);
  if (d.length !== 11 || allSameDigit(d)) return false;

  const calc = (len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * (len + 1 - i);
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export function validateCnpj(raw: string): boolean {
  const d = digits(raw);
  if (d.length !== 14 || allSameDigit(d)) return false;

  const calc = (len: number, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  return (
    calc(12, w1) === parseInt(d[12]) &&
    calc(13, w2) === parseInt(d[13])
  );
}

export function validateCpfOrCnpj(raw: string): boolean {
  const d = digits(raw);
  if (d.length === 11) return validateCpf(raw);
  if (d.length === 14) return validateCnpj(raw);
  return false;
}
