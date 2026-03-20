import { CB } from '../../constants/colors';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import type { FilterOptions, BatchStepNode } from '../../types';
import SettingsPanel from './SettingsPanel';
import FilterControls from './FilterControls';
import RowList from './RowList';
import BatchTree from './BatchTree';
import SidebarFooter from './SidebarFooter';

interface SidebarProps {
  filteredIndices: number[];
  filterOpts: FilterOptions;
  activeFilters: boolean;
  batchTree: BatchStepNode[];
  dk: (l: string, d: string) => string;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Sidebar({
  filteredIndices,
  filterOpts,
  activeFilters,
  batchTree,
  dk,
  fileRef,
  onFileChange,
}: SidebarProps) {
  const { rows, selRows, sidebarView, showSettings, settings } = useAppState();
  const dispatch = useAppDispatch();

  const selectAll = () => dispatch({ type: 'SET_SEL_ROWS', selRows: [...filteredIndices] });
  const selectNone = () => dispatch({ type: 'SET_SEL_ROWS', selRows: [] });
  const startCompare = () => dispatch({ type: 'SET_COMPARE', on: true });

  return (
    <div
      data-sidebar=""
      style={{
        width: 240,
        borderRight: '1px solid ' + dk('cbd5e1', '334155'),
        overflowY: 'auto',
        background: dk('f8fafc', '1e293b'),
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 14px',
          borderBottom: '1px solid ' + dk('e2e8f0', '334155'),
          color: dk('0f172a', 'f1f5f9'),
          background: dk('fff', '1e293b'),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: CB.blue }}>Explorer</div>
          <button
            onClick={() => dispatch({ type: 'SET_SHOW_SETTINGS', show: !showSettings })}
            title="Settings"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid ' + dk('cbd5e1', '475569'),
              background: showSettings ? CB.blue : dk('fff', '334155'),
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: showSettings ? '#fff' : dk('64748b', '94a3b8'),
            }}
          >
            ⚙
          </button>
        </div>
        <div style={{ fontSize: 11, color: dk('64748b', '94a3b8'), marginTop: 4, fontWeight: 500 }}>
          {rows.length} total · {filteredIndices.length} shown · {selRows.length} sel
          {settings.autoSave && rows.length > 0 ? ' · 💾' : ''}
        </div>
      </div>

      {showSettings && <SettingsPanel dk={dk} />}

      <FilterControls
        filterOpts={filterOpts}
        filteredCount={filteredIndices.length}
        activeFilters={activeFilters}
        selCount={selRows.length}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        onCompare={startCompare}
      />

      {/* View Toggle */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        {(
          [
            ['list', '📋 List'],
            ['batch', '🌳 Batch'],
          ] as const
        ).map(([v, l]) => (
          <button
            key={v}
            onClick={() => dispatch({ type: 'SET_SIDEBAR_VIEW', view: v })}
            style={{
              flex: 1,
              padding: '6px 0',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              color: sidebarView === v ? CB.blue : '#94a3b8',
              borderBottom: sidebarView === v ? `2px solid ${CB.blue}` : '2px solid transparent',
              border: 'none',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* List / Tree content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sidebarView === 'batch' ? (
          <BatchTree batchTree={batchTree} />
        ) : (
          <RowList filteredIndices={filteredIndices} />
        )}
      </div>

      <SidebarFooter fileRef={fileRef} onFileChange={onFileChange} />
    </div>
  );
}
