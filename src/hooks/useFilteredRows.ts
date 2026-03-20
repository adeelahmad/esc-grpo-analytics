import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import type { FilterOptions } from '../types';

export function useFilteredRows() {
  const { rows, filters } = useAppState();

  const filterOpts = useMemo<FilterOptions>(() => {
    if (!rows.length) return { views: [], types: [], members: [], steps: [] };
    const views = new Set<string>(), types = new Set<string>(), members = new Set<string>(), steps = new Set<string>();
    rows.forEach(r => {
      const m = r.metadata || {};
      if (m._view_name) views.add(m._view_name);
      if (r.type) types.add(r.type);
      if (m._esc_member_idx != null) members.add(String(m._esc_member_idx));
      steps.add(String(Math.floor(r.iteration ?? 0)));
    });
    return {
      views: [...views].sort(),
      types: [...types].sort(),
      members: [...members].sort((a, b) => Number(a) - Number(b)),
      steps: [...steps].sort((a, b) => Number(a) - Number(b)),
    };
  }, [rows]);

  const filteredIndices = useMemo(() => {
    return rows.map((_, i) => i).filter(i => {
      const r = rows[i], m = r.metadata || {};
      if (filters.view !== 'all' && (m._view_name || '') !== filters.view) return false;
      if (filters.correct === 'yes' && !r.correct) return false;
      if (filters.correct === 'no' && r.correct) return false;
      if (filters.type !== 'all' && (r.type || '') !== filters.type) return false;
      if (filters.member !== 'all' && String(m._esc_member_idx ?? '') !== filters.member) return false;
      if (filters.step !== 'all' && String(Math.floor(r.iteration ?? 0)) !== filters.step) return false;
      return true;
    });
  }, [rows, filters]);

  const activeFilters = filters.view !== 'all' || filters.correct !== 'all' || filters.type !== 'all' || filters.member !== 'all' || filters.step !== 'all';

  return { filteredIndices, filterOpts, activeFilters };
}
