import { CB } from '../../constants/colors';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import type { FilterOptions } from '../../types';

interface FilterControlsProps {
  filterOpts: FilterOptions;
  filteredCount: number;
  activeFilters: boolean;
  selCount: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onCompare: () => void;
}

export default function FilterControls({
  filterOpts, filteredCount, activeFilters, selCount,
  onSelectAll, onSelectNone, onCompare,
}: FilterControlsProps) {
  const { filters } = useAppState();
  const dispatch = useAppDispatch();

  const setFilter = (key: string, value: string) =>
    dispatch({ type: 'SET_FILTER', key: key as keyof typeof filters, value });

  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔍 Filters</span>
        {activeFilters && (
          <button onClick={() => dispatch({ type: 'CLEAR_FILTERS' })} style={{ fontSize: 9, color: CB.red, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
        )}
      </div>
      {/* Correct filter */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, width: 52, flexShrink: 0 }}>Correct</span>
        <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          {([['all', 'All'], ['yes', '✓ Only'], ['no', '✗ Only']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter('correct', v)} style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, cursor: 'pointer', fontWeight: 600, background: filters.correct === v ? CB.blue : '#f1f5f9', color: filters.correct === v ? '#fff' : '#475569', border: filters.correct === v ? 'none' : '1px solid #cbd5e1' }}>{l}</button>
          ))}
        </div>
      </div>
      {/* View filter */}
      {filterOpts.views.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, width: 52, flexShrink: 0 }}>View</span>
          <select value={filters.view} onChange={e => setFilter('view', e.target.value)} style={{ flex: 1, fontSize: 10, padding: '2px 4px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>
            <option value="all">All views</option>
            {filterOpts.views.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}
      {/* Type filter */}
      {filterOpts.types.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, width: 52, flexShrink: 0 }}>Type</span>
          <select value={filters.type} onChange={e => setFilter('type', e.target.value)} style={{ flex: 1, fontSize: 10, padding: '2px 4px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>
            <option value="all">All types</option>
            {filterOpts.types.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}
      {/* Member filter */}
      {filterOpts.members.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, width: 52, flexShrink: 0 }}>Member</span>
          <select value={filters.member} onChange={e => setFilter('member', e.target.value)} style={{ flex: 1, fontSize: 10, padding: '2px 4px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>
            <option value="all">All members</option>
            {filterOpts.members.map(v => <option key={v} value={v}>G{v}</option>)}
          </select>
        </div>
      )}
      {/* Step filter */}
      {filterOpts.steps.length > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, width: 52, flexShrink: 0 }}>Step</span>
          <select value={filters.step} onChange={e => setFilter('step', e.target.value)} style={{ flex: 1, fontSize: 10, padding: '2px 4px', borderRadius: 4, border: '1px solid #cbd5e1', background: '#fff', color: '#334155' }}>
            <option value="all">All steps</option>
            {filterOpts.steps.map(v => <option key={v} value={v}>Step {v}</option>)}
          </select>
        </div>
      )}
      {/* Select All / None / Compare */}
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <button onClick={onSelectAll} style={{ flex: 1, padding: '3px 0', fontSize: 9, fontWeight: 600, cursor: 'pointer', background: '#dbeafe', color: CB.blue, border: '1px solid #93c5fd', borderRadius: 4 }}>Select all ({filteredCount})</button>
        <button onClick={onSelectNone} style={{ flex: 1, padding: '3px 0', fontSize: 9, fontWeight: 600, cursor: 'pointer', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4 }}>Select none</button>
      </div>
      {selCount >= 2 && selCount <= 4 && (
        <button onClick={onCompare} style={{ width: '100%', padding: '6px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: `linear-gradient(135deg,${CB.blue},${CB.purple})`, color: '#fff', border: 'none', borderRadius: 6, marginTop: 4, boxShadow: '0 2px 8px rgba(0,119,187,0.3)' }}>⚖️ Compare {selCount} rows side-by-side</button>
      )}
    </div>
  );
}
