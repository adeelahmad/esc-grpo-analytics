import { useEffect } from 'react';
import { storage } from '../utils/storage';
import { useAppState, useAppDispatch } from '../context/AppContext';
import type { AppSettings, Rollout } from '../types';

/* Load settings + saved data on mount */
export function useLoadPersistedData() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get('esc-settings');
        if (s) dispatch({ type: 'SET_SETTINGS', settings: JSON.parse(s) as AppSettings });
      } catch {
        /* ignore */
      }
      try {
        const d = await storage.get('esc-data');
        if (d) {
          const p = JSON.parse(d) as Rollout[];
          if (p && p.length) dispatch({ type: 'SET_ROWS', rows: p });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [dispatch]);
}

/* Auto-save rows when they change */
export function useAutoSaveRows() {
  const { rows, settings } = useAppState();

  useEffect(() => {
    if (!settings.autoSave || !rows.length) return;
    const t = setTimeout(() => {
      storage.set('esc-data', JSON.stringify(rows));
    }, 500);
    return () => clearTimeout(t);
  }, [rows, settings.autoSave]);
}

/* Persist settings on change */
export function usePersistSettings() {
  const { settings } = useAppState();

  useEffect(() => {
    storage.set('esc-settings', JSON.stringify(settings));
  }, [settings]);
}
