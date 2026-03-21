import type { Rollout } from '../../types';
import { CB } from '../../constants/colors';
import { safeMax, safeMin } from '../../utils/math';
import { fmtIter } from '../../utils/format';
import { isForced } from '../../utils/data';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import HelpBox from '../ui/HelpBox';

interface GroupTabProps {
  rows: Rollout[];
  selRow: number;
  setSelRow: (i: number) => void;
  onCompare?: (indices: number[]) => void;
  onAnimate?: (target: number, queue: number[]) => void;
}

export default function GroupTab({ rows, selRow, setSelRow, onCompare, onAnimate }: GroupTabProps) {
  const cur = rows[selRow];
  if (!cur) return null;
  const prompt = cur.prompt || cur.prompt_text || '';
  const siblings = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => (r.prompt || r.prompt_text) === prompt);
  if (siblings.length <= 1)
    return (
      <div
        style={{
          color: 'var(--color-text-secondary)',
          padding: '24px 0',
          textAlign: 'center',
          fontSize: 13,
        }}
      >
        No sibling rows with same prompt.
      </div>
    );
  const rewards = siblings.map(({ r }) => r.reward ?? 0),
    advs = siblings.map(({ r }) => r.advantage ?? 0);
  const avgR = rewards.reduce((a, b) => a + b, 0) / rewards.length,
    maxR = safeMax(rewards),
    minR = safeMin(rewards);
  const curR = cur.reward ?? 0,
    delta = curR - avgR,
    rank = [...rewards].sort((a, b) => b - a).indexOf(curR) + 1;
  const correct = siblings.reduce((a, { r }) => a + (r.correct ? 1 : 0), 0);
  const maxAdvS = siblings.reduce((b, c) => ((c.r.advantage ?? 0) > (b.r.advantage ?? 0) ? c : b));
  const minAdvS = siblings.reduce((w, c) => ((c.r.advantage ?? 0) < (w.r.advantage ?? 0) ? c : w));
  const mAdv = safeMax(advs),
    miAdv = safeMin(advs);
  return (
    <div style={{ paddingBottom: 40 }}>
      <HelpBox>
        <strong>Group = all rollouts sharing the same prompt.</strong> In ESC-GRPO, each prompt
        generates a group of rollouts with different scaffold views (esc_0, esc_1, naked). The 🏆
        WINNER is the rollout with the highest advantage (the one GRPO learns from most). The 💀
        LEAST ADV is the one that contributed least. Your current row is highlighted in blue.
      </HelpBox>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {onCompare && siblings.length >= 2 && siblings.length <= 4 && (
          <button
            onClick={() => onCompare(siblings.map((s) => s.i))}
            style={{
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: `linear-gradient(135deg,${CB.blue},${CB.purple})`,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,119,187,0.3)',
            }}
          >
            ⚖️ Compare these {siblings.length} siblings side-by-side
          </button>
        )}
        {onAnimate && siblings.length >= 2 && (
          <button
            onClick={() =>
              onAnimate(
                siblings[0].i,
                siblings.map((s) => s.i),
              )
            }
            style={{
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: `linear-gradient(135deg,${CB.green},${CB.cyan})`,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,153,136,0.3)',
            }}
          >
            ▶ Animate Group
          </button>
        )}
      </div>
      <Panel title="Group Comparison Insights" bc={CB.purple}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <Chip label="Group" value={siblings.length} bg="#f8fafc" color="#0f172a" />
          <Chip
            label="Rank"
            value={`#${rank}/${siblings.length}`}
            bg={rank === 1 ? '#dcfce7' : rank === siblings.length ? '#fee2e2' : '#eff6ff'}
            color={rank === 1 ? CB.green : rank === siblings.length ? CB.red : CB.blue}
          />
          <Chip
            label="Correct"
            value={`${correct}/${siblings.length}`}
            bg={correct === siblings.length ? '#dcfce7' : '#fee2e2'}
            color={correct === siblings.length ? CB.green : CB.red}
          />
          <Chip label="Avg R" value={avgR.toFixed(3)} bg="#f0fdf4" color={CB.green} />
          <Chip label="Max R" value={maxR.toFixed(3)} bg="#fefce8" color={CB.yellow} />
          <Chip
            label="Δ avg"
            value={(delta >= 0 ? '+' : '') + delta.toFixed(3)}
            bg={delta >= 0 ? '#dcfce7' : '#fee2e2'}
            color={delta >= 0 ? CB.green : CB.red}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {(
            [
              [
                maxAdvS,
                '🏆',
                'WINNER',
                '#dcfce7',
                '#f0fdf4',
                '#86efac',
                CB.green,
                '#166534',
              ] as const,
              [
                minAdvS,
                '💀',
                'LEAST ADV',
                '#fee2e2',
                '#fef2f2',
                '#fca5a5',
                CB.red,
                '#991b1b',
              ] as const,
            ] as const
          ).map(([sib, icon, title, bg1, bg2, bdr, accent, dark], idx) => {
            if (!sib) return null;
            const m = sib.r.metadata || {};
            return (
              <div
                key={idx}
                onClick={() => setSelRow(sib.i)}
                style={{
                  background: `linear-gradient(135deg,${bg1},${bg2})`,
                  border: `1.5px solid ${bdr}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: accent,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      background: '#fff',
                      padding: '2px 8px',
                      borderRadius: 12,
                      border: `1px solid ${bdr}`,
                      fontWeight: 600,
                      color: dark,
                    }}
                  >
                    Row {sib.i + 1}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 22,
                    fontWeight: 800,
                    color: dark,
                    marginBottom: 8,
                  }}
                >
                  A = {(sib.r.advantage ?? 0).toFixed(4)}
                </div>
                <div
                  style={{ display: 'flex', gap: 8, fontSize: 12, color: dark, fontWeight: 600 }}
                >
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    R:{(sib.r.reward ?? 0).toFixed(3)}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {sib.r.correct ? '✓' : '✗'}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {m._view_name || '?'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#334155',
              marginBottom: 10,
              textTransform: 'uppercase',
            }}
          >
            Reward Distribution (Ranked)
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80 }}>
            {[...siblings]
              .sort((a, b) => (b.r.reward ?? 0) - (a.r.reward ?? 0))
              .map(({ r, i }, idx) => {
                const rw = r.reward ?? 0,
                  absMax = Math.max(Math.abs(maxR), Math.abs(minR), 0.001);
                const h = Math.max(4, Math.round((Math.abs(rw) / absMax) * 65));
                const isMe = i === selRow,
                  isW = idx === 0,
                  isL = idx === siblings.length - 1;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelRow(i)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      opacity: isMe ? 1 : 0.7,
                    }}
                  >
                    {isW && <div style={{ fontSize: 14, marginBottom: 2 }}>🏆</div>}
                    {isL && <div style={{ fontSize: 14, marginBottom: 2 }}>💀</div>}
                    <div
                      style={{
                        width: '85%',
                        maxWidth: 48,
                        height: h,
                        background: isMe
                          ? `linear-gradient(to top,${CB.blue},#60a5fa)`
                          : rw > 0
                            ? `linear-gradient(to top,${CB.green},#4ade80)`
                            : `linear-gradient(to top,${CB.red},#f87171)`,
                        borderRadius: '4px 4px 0 0',
                        border: isMe ? '2px solid #1e3a8a' : 'none',
                        boxShadow: isMe ? `0 0 10px ${CB.blue}66` : 'none',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: isMe ? 800 : 500,
                        color: isMe ? '#1e3a8a' : '#64748b',
                        marginTop: 4,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {rw.toFixed(2)}
                    </div>
                    {isMe && (
                      <div
                        style={{
                          fontSize: 8,
                          color: CB.blue,
                          fontWeight: 800,
                          marginTop: 2,
                          background: '#dbeafe',
                          padding: '1px 4px',
                          borderRadius: 4,
                        }}
                      >
                        YOU
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </Panel>
      <Panel title={`Members (${siblings.length})`} bc={CB.purple}>
        {siblings.map(({ r, i }) => {
          const m = r.metadata || {},
            active = i === selRow,
            vn = m._view_name || '?',
            adv = r.advantage ?? 0;
          const isW = adv === mAdv && siblings.length > 1,
            isL = adv === miAdv && siblings.length > 1 && mAdv !== miAdv;
          return (
            <div
              key={i}
              onClick={() => setSelRow(i)}
              style={{
                border: `${active ? '2px' : isW ? '1.5px' : isL ? '1.5px' : '1px'} solid ${active ? CB.blue : isW ? CB.green : isL ? CB.red : '#e2e8f0'}`,
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                cursor: 'pointer',
                background: active ? '#eff6ff' : isW ? '#f0fdf4' : isL ? '#fef2f2' : '#fff',
                boxShadow: active ? '0 4px 12px rgba(37,99,235,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                {isW && <span style={{ fontSize: 16 }}>🏆</span>}
                {isL && <span style={{ fontSize: 16 }}>💀</span>}
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Row {i + 1}</span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    fontWeight: 600,
                    background: '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {fmtIter(r.iteration)}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    background: vn === 'esc_1' ? '#dcfce7' : vn === 'esc_0' ? '#dbeafe' : '#f1f5f9',
                    color: vn === 'esc_1' ? '#166534' : vn === 'esc_0' ? '#1e40af' : '#334155',
                  }}
                >
                  {vn.toUpperCase()}
                  {m._view_is_naked ? ' (NAKED)' : ''}
                </span>
                {m._esc_forced_answer && (
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: '#fff7ed',
                      color: '#c2410c',
                      border: '1px solid #fed7aa',
                    }}
                  >
                    💉 FORCED
                  </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  {onAnimate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnimate(i, [i]);
                      }}
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: `linear-gradient(135deg,${CB.green},${CB.cyan})`,
                        color: '#fff',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ▶
                    </button>
                  )}
                  {isW && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: CB.green,
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      WINNER
                    </span>
                  )}
                  {isL && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: CB.red,
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      LEAST ADV
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: r.correct ? CB.green : CB.red,
                      background: r.correct ? '#dcfce7' : '#fee2e2',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#f8fafc',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    R:{r.reward?.toFixed(3)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: adv > 0 ? CB.green : CB.red,
                      fontWeight: 700,
                      background: adv > 0 ? '#f0fdf4' : '#fef2f2',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    A:{adv.toFixed(3)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  background: 'rgba(241,245,249,0.5)',
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #e2e8f0',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  Answer:{' '}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#334155' }}>
                  {(r.generated_answer || '—').substring(0, 100)}
                </span>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
