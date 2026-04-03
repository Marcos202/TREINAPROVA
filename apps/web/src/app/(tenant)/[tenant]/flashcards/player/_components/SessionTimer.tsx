'use client';

import { useEffect, useRef, useState } from 'react';

// ── SessionTimer ───────────────────────────────────────────────────────────────
//
// The start time is stored in a ref (not state) so it is set exactly once,
// at mount, and never changes. Elapsed seconds are computed as:
//
//   elapsed = floor((Date.now() - startTime) / 1000)
//
// This means even if the component re-renders for any reason (window resize,
// parent state updates, etc.), the displayed time is always the correct
// wall-clock difference — it never resets.
//
// The interval is cleared on unmount via the useEffect return.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Called every second with the current elapsed seconds (for parent to capture on complete). */
  onTick?: (seconds: number) => void;
}

export function SessionTimer({ onTick }: Props) {
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(secs);
      onTick?.(secs);
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // empty deps: runs once on mount only

  return (
    <div className="flex items-center gap-1.5 text-slate-400">
      <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="text-[13px] font-semibold tabular-nums tracking-tight">
        {formatTime(elapsed)}
      </span>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
