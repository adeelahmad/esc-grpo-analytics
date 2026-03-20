import { CB } from '../../constants/colors';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import { useAppState, useAppDispatch } from '../../context/AppContext';

interface RowListProps {
  filteredIndices: number[];
}

export default function RowList({ filteredIndices }: RowListProps) {
  const { rows, sel, selRows } = useAppState();
  const dispatch = useAppDispatch();

  const toggleSel = (i: number) => dispatch({ type: 'TOGGLE_SEL', index: i });

  return (
    <>
      {filteredIndices.map((i) => {
        const r = rows[i],
          rw = r.reward ?? 0,
          ok = r.correct;
        const vn = (r.metadata || ({} as any))._view_name || '';
        const isSel = selRows.includes(i),
          isA = sel === i;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: isA ? '#eff6ff' : isSel ? '#f1f5f9' : '#fff',
              borderLeft: `4px solid ${ok ? CB.green : rw > 0 ? CB.orange : CB.red}`,
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleSel(i);
              }}
              style={{
                width: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: isSel ? `1.5px solid ${CB.blue}` : '1.5px solid #cbd5e1',
                  background: isSel ? CB.blue : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'white',
                  fontWeight: 800,
                }}
              >
                {isSel ? '✓' : ''}
              </div>
            </div>
            <div
              onClick={() => {
                dispatch({ type: 'SET_SEL', sel: i });
                dispatch({ type: 'SET_TAB', tab: 'overview' });
              }}
              style={{ padding: '10px 8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
            >
              <div style={{ color: isA ? CB.blue : '#0f172a', fontWeight: 700, fontSize: 12 }}>
                Row {i + 1}{' '}
                <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: 10 }}>
                  {fmtIter(r.iteration)}
                </span>
              </div>
              <div
                style={{
                  color: '#475569',
                  fontSize: 10,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                R:{rw.toFixed(2)} {ok ? '✓' : '✗'}
                {isForced(r) && (
                  <span
                    style={{
                      marginLeft: 3,
                      fontSize: 8,
                      padding: '0 3px',
                      borderRadius: 2,
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    💉
                  </span>
                )}{' '}
                <span style={{ color: '#94a3b8' }}>{vn}</span>
                {r.type && (
                  <span
                    style={{
                      marginLeft: 4,
                      fontSize: 8,
                      padding: '0 3px',
                      borderRadius: 2,
                      background: '#e2e8f0',
                      color: '#475569',
                    }}
                  >
                    {r.type}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
