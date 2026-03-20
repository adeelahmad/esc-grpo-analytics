import { CB } from '../../constants/colors';
import { isForced } from '../../utils/data';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import type { BatchStepNode } from '../../types';

interface BatchTreeProps {
  batchTree: BatchStepNode[];
}

export default function BatchTree({ batchTree }: BatchTreeProps) {
  const { rows, sel, selRows, treeOpen } = useAppState();
  const dispatch = useAppDispatch();

  const toggleTree = (key: string) => dispatch({ type: 'TOGGLE_TREE', key });
  const toggleSel = (i: number) => dispatch({ type: 'TOGGLE_SEL', index: i });

  if (batchTree.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
        No rows match current filters.
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {batchTree.map((stepNode) => {
        const sK = String(stepNode.step),
          sOpen = treeOpen[sK] !== false;
        const avgR = stepNode.rewards.length
          ? stepNode.rewards.reduce((a, b) => a + b, 0) / stepNode.rewards.length
          : 0;
        return (
          <div key={sK}>
            <div
              onClick={() => toggleTree(sK)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 10px',
                cursor: 'pointer',
                background: sOpen ? '#eff6ff' : '#fff',
                borderBottom: '1px solid #e2e8f0',
                borderLeft: `3px solid ${CB.blue}`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: CB.blue,
                  fontWeight: 800,
                  transform: sOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                  display: 'inline-block',
                }}
              >
                ▶
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                Step {stepNode.step}
              </span>
              <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginLeft: 'auto' }}>
                {stepNode.total}r
              </span>
              <span style={{ fontSize: 9, color: CB.green, fontWeight: 600 }}>
                {stepNode.correct}✓
              </span>
              {stepNode.forced > 0 && (
                <span style={{ fontSize: 9, color: '#c2410c', fontWeight: 600 }}>
                  💉{stepNode.forced}
                </span>
              )}
              <span style={{ fontSize: 9, color: avgR > 0 ? CB.green : CB.red, fontWeight: 600 }}>
                {avgR.toFixed(2)}
              </span>
            </div>
            {sOpen &&
              Object.values(stepNode.subs)
                .sort((a, b) => a.sub - b.sub)
                .map((subNode) => {
                  const subK = `${sK}.${subNode.sub}`,
                    subOpen = treeOpen[subK] !== false;
                  return (
                    <div key={subK}>
                      <div
                        onClick={() => toggleTree(subK)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 10px 5px 24px',
                          cursor: 'pointer',
                          background: subOpen ? '#f8fafc' : '#fff',
                          borderBottom: '1px solid #f1f5f9',
                          borderLeft: `3px solid ${CB.cyan}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            color: CB.cyan,
                            fontWeight: 800,
                            transform: subOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s',
                            display: 'inline-block',
                          }}
                        >
                          ▶
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
                          .{subNode.sub}
                        </span>
                        <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto' }}>
                          {subNode.total}r
                        </span>
                        <span style={{ fontSize: 9, color: CB.green, fontWeight: 600 }}>
                          {subNode.correct}✓
                        </span>
                        {subNode.forced > 0 && (
                          <span style={{ fontSize: 9, color: '#c2410c', fontWeight: 600 }}>
                            💉{subNode.forced}
                          </span>
                        )}
                      </div>
                      {subOpen &&
                        Object.values(subNode.types).map((typeNode) => {
                          const tK = `${subK}.${typeNode.type}`,
                            tOpen = treeOpen[tK];
                          return (
                            <div key={tK}>
                              <div
                                onClick={() => toggleTree(tK)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px 4px 40px',
                                  cursor: 'pointer',
                                  background: tOpen ? '#faf5ff' : '#fff',
                                  borderBottom: '1px solid #f8fafc',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 8,
                                    color: CB.purple,
                                    fontWeight: 800,
                                    transform: tOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.15s',
                                    display: 'inline-block',
                                  }}
                                >
                                  ▶
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: CB.purple,
                                    background: '#f3e8ff',
                                    padding: '1px 5px',
                                    borderRadius: 3,
                                  }}
                                >
                                  {typeNode.type}
                                </span>
                                <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto' }}>
                                  {typeNode.rowIndices.length}r
                                </span>
                                <span style={{ fontSize: 9, color: CB.green, fontWeight: 600 }}>
                                  {typeNode.correct}✓
                                </span>
                                {typeNode.forced > 0 && (
                                  <span style={{ fontSize: 9, color: '#c2410c', fontWeight: 600 }}>
                                    💉{typeNode.forced}
                                  </span>
                                )}
                              </div>
                              {tOpen &&
                                typeNode.rowIndices.map((i) => {
                                  const r = rows[i],
                                    rw = r.reward ?? 0,
                                    ok = r.correct;
                                  const isSel = selRows.includes(i),
                                    isA = sel === i;
                                  const vn = (r.metadata || ({} as any))._view_name || '';
                                  return (
                                    <div
                                      key={i}
                                      style={{
                                        display: 'flex',
                                        borderBottom: '1px solid #f1f5f9',
                                        background: isA ? '#dbeafe' : isSel ? '#f1f5f9' : '#fff',
                                        paddingLeft: 48,
                                      }}
                                    >
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSel(i);
                                        }}
                                        style={{
                                          width: 24,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          flexShrink: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 3,
                                            border: isSel
                                              ? `1.5px solid ${CB.blue}`
                                              : '1.5px solid #cbd5e1',
                                            background: isSel ? CB.blue : '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 8,
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
                                        style={{
                                          padding: '5px 6px',
                                          cursor: 'pointer',
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: isA ? CB.blue : '#334155',
                                          }}
                                        >
                                          Row {i + 1}{' '}
                                          <span
                                            style={{
                                              color: ok ? CB.green : CB.red,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {ok ? '✓' : '✗'}
                                          </span>
                                          {isForced(r) && (
                                            <span
                                              style={{
                                                fontSize: 8,
                                                marginLeft: 3,
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
                                          <span style={{ color: '#94a3b8', fontSize: 9 }}>
                                            R:{rw.toFixed(2)}
                                          </span>
                                          {vn && (
                                            <span
                                              style={{
                                                fontSize: 8,
                                                marginLeft: 4,
                                                padding: '0 3px',
                                                borderRadius: 2,
                                                background: '#eff6ff',
                                                color: CB.blue,
                                              }}
                                            >
                                              {vn}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
          </div>
        );
      })}
    </div>
  );
}
