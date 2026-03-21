import { useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { parseJsonl } from '../utils/parseJsonl';

/** Detect absolute filesystem paths and proxy them through the Vite dev middleware. */
function toFetchUrl(url: string): string {
  if (/^\/[^/]/.test(url) || /^[a-zA-Z]:[\\/]/.test(url)) {
    return `/__rollouts?path=${encodeURIComponent(url)}`;
  }
  return url;
}

export function useAutoFetch() {
  const { settings } = useAppState();
  const dispatch = useAppDispatch();
  const lastContentRef = useRef<string>('');
  const { rolloutUrl, pollInterval } = settings;

  useEffect(() => {
    if (!rolloutUrl) return;

    const fetchData = async () => {
      try {
        const res = await fetch(toFetchUrl(rolloutUrl), { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        if (text === lastContentRef.current) return;
        lastContentRef.current = text;
        const rows = parseJsonl(text);
        if (rows.length) {
          dispatch({ type: 'REFRESH_ROWS', rows });
        }
      } catch {
        /* network error — silent retry on next poll */
      }
    };

    fetchData();
    const id = setInterval(fetchData, Math.max(pollInterval, 2) * 1000);
    return () => clearInterval(id);
  }, [rolloutUrl, pollInterval, dispatch]);
}
