import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import type { TabKey } from '../../types';

const TABS: { id: TabKey; lbl: string }[] = [
  { id: 'overview', lbl: 'Overview' },
  { id: 'scaffold', lbl: 'Scaffold Flow' },
  { id: 'tokens', lbl: 'Token Heatmaps' },
  { id: 'group', lbl: 'Group Insights' },
  { id: 'trends', lbl: 'Trends' },
  { id: 'persona', lbl: 'Persona Analysis' },
  { id: 'raw', lbl: 'Raw JSON' },
];

interface TabBarProps {
  activeFilters: boolean;
  filteredCount: number;
  dk: (l: string, d: string) => string;
}

export default function TabBar({ activeFilters, filteredCount, dk }: TabBarProps) {
  const { rows, sel, tab, compareMode, selRows } = useAppState();
  const dispatch = useAppDispatch();
  const row = rows[sel];

  return (
    <div
      data-tabbar=""
      style={{
        display: 'flex',
        borderBottom: '1px solid ' + dk('cbd5e1', '334155'),
        background: dk('fff', '1e293b'),
        padding: '0 8px',
        flexShrink: 0,
        alignItems: 'center',
        overflowX: 'auto',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => dispatch({ type: 'SET_TAB', tab: t.id })}
          style={{
            padding: '14px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: tab === t.id ? `3px solid ${CB.blue}` : '3px solid transparent',
            color: tab === t.id ? CB.blue : '#64748b',
            fontWeight: tab === t.id ? 700 : 600,
            fontSize: 13,
            whiteSpace: 'nowrap',
          }}
        >
          {t.lbl}
        </button>
      ))}
      {compareMode && (
        <button
          onClick={() => dispatch({ type: 'SET_COMPARE', on: false })}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: CB.red,
            color: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            marginLeft: 8,
          }}
        >
          ✕ Exit Compare
        </button>
      )}
      <div
        data-tabinfo=""
        style={{
          marginLeft: 'auto',
          paddingRight: 16,
          fontSize: 12,
          color: '#475569',
          whiteSpace: 'nowrap',
          fontWeight: 600,
        }}
      >
        {compareMode ? (
          <span style={{ color: CB.purple, fontWeight: 700 }}>
            ⚖️ Comparing {selRows.length} rows
          </span>
        ) : (
          row && (
            <>
              Row {sel + 1}/{rows.length}
              {activeFilters ? ` (${filteredCount} filtered)` : ''}{' '}
              <span style={{ opacity: 0.4, margin: '0 6px' }}>|</span>{' '}
              <span style={{ color: row.correct ? CB.green : CB.red }}>
                {row.correct ? '✓' : '✗'}
              </span>
              {isForced(row) && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                  }}
                >
                  💉
                </span>
              )}
              {row.type && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: '#e2e8f0',
                    color: '#475569',
                  }}
                >
                  {row.type}
                </span>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

export { TABS };
