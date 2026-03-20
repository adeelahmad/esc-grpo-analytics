import { useRef, useCallback } from 'react';
import { useAppDispatch } from '../context/AppContext';
import { parseJsonl } from '../utils/parseJsonl';

export function useDataLoader() {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = useCallback(
    (text: string) => {
      const rows = parseJsonl(text);
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
