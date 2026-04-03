'use client';

/**
 * CardPreview — visual animated credit card.
 * Updates based on gateway onChange callbacks (masked data only).
 * NEVER receives raw card numbers. Cosmetic component only.
 */

interface CardPreviewProps {
  holderName: string;
  brand?:     string;
  last4?:     string;
  isFlipped:  boolean;  // true when CVV field is focused
}

const BRAND_COLORS: Record<string, string> = {
  visa:       'linear-gradient(135deg, #1a1f71 0%, #1434cb 100%)',
  mastercard: 'linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)',
  amex:       'linear-gradient(135deg, #007bc1 0%, #00b4e6 100%)',
  elo:        'linear-gradient(135deg, #00a4e0 0%, #ffb74d 100%)',
  hipercard:  'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)',
  default:    'linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)',
};

function getBrandGradient(brand?: string): string {
  return BRAND_COLORS[brand ?? ''] ?? BRAND_COLORS.default;
}

export default function CardPreview({ holderName, brand, last4, isFlipped }: CardPreviewProps) {
  const gradient = getBrandGradient(brand);
  const displayNumber = last4
    ? `•••• •••• •••• ${last4}`
    : '•••• •••• •••• ••••';
  const displayName = holderName?.trim().toUpperCase() || 'NOME DO TITULAR';

  return (
    <div
      className="relative w-full max-w-[300px] mx-auto"
      style={{ perspective: '1000px', height: '175px' }}
    >
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-xl"
          style={{ background: gradient, backfaceVisibility: 'hidden' }}
        >
          {/* Chip + contactless */}
          <div className="flex items-center justify-between">
            <div className="w-9 h-7 rounded bg-yellow-300/80 flex items-center justify-center">
              <div className="w-6 h-4 rounded-sm border-2 border-yellow-600/40 grid grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-yellow-600/30" />
                ))}
              </div>
            </div>
            <svg className="w-7 h-7 text-white/70" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" opacity={0.4}/>
              <path d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" opacity={0.6}/>
              <circle cx={12} cy={12} r={3} />
            </svg>
          </div>

          {/* Card number */}
          <p className="text-white font-mono text-base tracking-widest drop-shadow-sm">
            {displayNumber}
          </p>

          {/* Holder + expiry */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Portador</p>
              <p className="text-white text-[12px] font-semibold tracking-wide truncate max-w-[160px]">
                {displayName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">Válido até</p>
              <p className="text-white text-[12px] font-semibold tracking-wide">MM/AA</p>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl shadow-xl overflow-hidden"
          style={{ background: gradient, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute top-7 inset-x-0 h-10 bg-black/60" />
          <div className="absolute bottom-10 inset-x-0 px-5">
            <div className="bg-white/90 rounded h-9 flex items-center justify-end pr-4">
              <p className="font-mono text-slate-800 text-sm tracking-widest">•••</p>
            </div>
            <p className="text-white/60 text-[10px] text-right mt-1">CVV</p>
          </div>
        </div>
      </div>
    </div>
  );
}
