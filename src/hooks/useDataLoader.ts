import { useRef, useCallback } from 'react';
import { useAppDispatch } from '../context/AppContext';
import type { Rollout } from '../types';

export function useDataLoader() {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = useCallback(
    (text: string) => {
      const rows = text
        .trim()
        .split('\n')
        .flatMap((l) => {
          try {
            return [JSON.parse(l.trim()) as Rollout];
          } catch {
            return [];
          }
        });
      if (rows.length) {
        dispatch({ type: 'SET_ROWS', rows });
      }
    },
    [dispatch],
  );

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => parse(ev.target?.result as string);
      r.readAsText(f);
      e.target.value = '';
    },
    [parse],
  );

  return { fileRef, parse, handleFile };
}
