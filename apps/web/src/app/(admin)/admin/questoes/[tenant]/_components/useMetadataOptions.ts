'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'tp_meta';

/**
 * Persists a list of string options for a given (tenant, field) pair in localStorage.
 * Used to enable "quick-fill" dropdowns in the question metadata form.
 */
export function useMetadataOptions(tenant: string, field: string) {
  const storageKey = `${STORAGE_PREFIX}:${tenant}:${field}`;
  const [options, setOptions] = useState<string[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setOptions(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, [storageKey]);

  const persist = (opts: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(opts));
    } catch {
      // ignore quota errors
    }
  };

  const add = useCallback(
    (value: string) => {
      const v = value.trim();
      if (!v) return;
      setOptions((prev) => {
        if (prev.includes(v)) return prev;
        const next = [v, ...prev]; // newest first
        persist(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey],
  );

  const remove = useCallback(
    (value: string) => {
      setOptions((prev) => {
        const next = prev.filter((o) => o !== value);
        persist(next);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey],
  );

  return { options, add, remove };
}
