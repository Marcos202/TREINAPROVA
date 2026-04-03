'use client';

interface Props {
  confidence: number;   // 0–100
  needsReview?: boolean;
  className?: string;
}

/**
 * Badge visual que comunica o nível de confiança da IA para um campo.
 *
 *  ≥ 85 → verde   — alta confiança
 *  60–84 → amarelo — confiança média
 *  < 60  → vermelho — baixa confiança, revisão obrigatória
 */
export function ConfidenceBadge({ confidence, needsReview, className = '' }: Props) {
  const level =
    confidence >= 85 ? 'high' : confidence >= 60 ? 'medium' : 'low';

  const styles = {
    high:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50   text-amber-700   border-amber-200',
    low:    'bg-red-50     text-red-700     border-red-200',
  }[level];

  const icon = {
    high:   '✦',
    medium: '⚡',
    low:    '⚠',
  }[level];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles} ${className}`}
      title={`IA: ${confidence}% de confiança${needsReview ? ' — revisão recomendada' : ''}`}
    >
      {icon} {confidence}%
    </span>
  );
}
