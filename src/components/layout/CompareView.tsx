import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { TABS } from './TabBar';
import type { Rollout } from '../../types';
import OverviewTab from '../tabs/OverviewTab';
import ScaffoldTab from '../tabs/ScaffoldTab';
import TokenTab from '../tabs/TokenTab';
import GroupTab from '../tabs/GroupTab';
import StreamTab from '../tabs/StreamTab';
import TrendsTab from '../tabs/TrendsTab';
import WandbDashboardTab from '../tabs/WandbDashboardTab';

interface CompareViewProps {
  exporting?: boolean;
}

export default function CompareView({ exporting }: CompareViewProps) {
  const { rows, sel, tab, selRows } = useAppState();
  const dispatch = useAppDispatch();

  const cmpRows = selRows.map((i) => rows[i]).filter(Boolean);
  const n = cmpRows.length;
  const cols = `repeat(${n},1fr)`;
  const samePrompt = cmpRows.every(
    (r) => (r.prompt || r.prompt_text) === (cmpRows[0].prompt || cmpRows[0].prompt_text),
  );

  const renderTab = (r: Rollout, idx: number, tabId?: string) => {
    const t = tabId || tab;
    const m = r.metadata || {};
    if (t === 'overview') return <OverviewTab row={r} rows={rows} />;
    if (t === 'scaffold') return <ScaffoldTab row={r} />;
    if (t === 'stream') return <StreamTab row={r} rows={rows} />;
    if (t === 'tokens')
      return (
        <TokenTab
          weights={(m as any)._is_weights || []}
          changes={(m as any).token_changes || []}
          segments={r.segments || []}
        />
      );
    if (t === 'group')
      return (
        <GroupTab
          rows={rows}
          selRow={selRows[idx]}
          setSelRow={(i: number) => dispatch({ type: 'SET_SEL', sel: i })}
          onCompare={(idxs: number[]) => {
            dispatch({ type: 'SET_SEL_ROWS', selRows: idxs.slice(0, 4) });
            dispatch({ type: 'SET_COMPARE', on: true });
          }}
        />
      );
    if (t === 'trends') return <TrendsTab rows={rows} />;
    if (t === 'dashboard') return <WandbDashboardTab rows={rows} row={r} />;
    if (t === 'raw')
      return (
        <pre
          style={{
            fontSize: 10,
            background: '#1e293b',
            padding: 10,
            borderRadius: 6,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            color: '#f8fafc',
            lineHeight: 1.4,
            maxHeight: '100%',
            margin: 0,
          }}
        >
          {JSON.stringify(r, null, 2)}
        </pre>
      );
    return null;
  };

  return (
    <div>
      {/* Delta summary banner */}
      <div
        style={{
          background: 'linear-gradient(135deg,#eff6ff,#f5f3ff)',
          border: '1px solid #bfdbfe',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>⚖️</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a' }}>
            Side-by-Side Comparison · {n} rows
            {samePrompt ? ' · Same prompt (siblings)' : ' · Different prompts'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
          {cmpRows.map((r, ci) => {
            const ok = r.correct,
              m = r.metadata || {},
              st = (r.step || (m as any).step || {}) as Record<string, any>;
            return (
              <div
                key={ci}
                style={{
                  background: '#fff',
                  borderRadius: 6,
                  padding: 8,
                  border: `2px solid ${ok ? CB.green : CB.red}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: ok ? CB.green : CB.red,
                    marginBottom: 4,
                  }}
                >
                  Row {selRows[ci] + 1} · {fmtIter(r.iteration)} {ok ? '✓' : '✗'}
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: ok ? '#dcfce7' : '#fee2e2',
                      fontWeight: 600,
                    }}
                  >
                    R:{(r.reward ?? 0).toFixed(3)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: '#f0f9ff',
                      fontWeight: 600,
                    }}
                  >
                    A:{(r.advantage ?? 0).toFixed(3)}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: '#faf5ff',
                      fontWeight: 600,
                    }}
                  >
                    {(m as any)._view_name || '?'}
                  </span>
                  {st.weight_angle_avg != null && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: '#fdf4ff',
                        fontWeight: 600,
                      }}
                    >
                      {st.weight_angle_avg.toFixed(3)}°
                    </span>
                  )}
                  {isForced(r) && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: '#fff7ed',
                        color: '#c2410c',
                        fontWeight: 700,
                        border: '1px solid #fed7aa',
                      }}
                    >
                      💉
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Side-by-side tab content */}
      {(exporting ? TABS.map((t) => t.id) : [tab]).map((tabId, tIdx) => (
        <div key={tabId} className={exporting && tIdx > 0 ? 'export-tab-section' : undefined}>
          {exporting && (
            <h2
              className="export-tab-header"
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 12px',
                padding: '12px 0 8px',
                borderBottom: '2px solid #cbd5e1',
                color: '#0f172a',
              }}
            >
              {TABS.find((t) => t.id === tabId)?.lbl}
            </h2>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 10, alignItems: 'start' }}>
            {cmpRows.map((r, ci) => (
              <div
                key={ci}
                style={{
                  minWidth: 0,
                  borderRadius: 8,
                  border: `1.5px solid ${r.correct ? CB.green : CB.red}33`,
                  background: 'var(--color-background-primary)',
                  padding: 8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: r.correct ? CB.green : CB.red,
                    marginBottom: 6,
                    padding: '2px 8px',
                    background: r.correct ? '#dcfce7' : '#fee2e2',
                    borderRadius: 4,
                    display: 'inline-block',
                  }}
                >
                  Row {selRows[ci] + 1} · {fmtIter(r.iteration)} ·{' '}
                  {(r.metadata as any)?._view_name || '?'}
                </div>
                {renderTab(r, ci, tabId)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
