import React, { useState, useEffect, useRef } from 'react';
import type { Rollout, Segment, TooltipData, TooltipPos } from '../../types';
import { CB, segRole, RV, getSrc, tagBg } from '../../constants/colors';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { useAnimationState } from '../../hooks/useAnimationState';
import Chip from '../ui/Chip';
import Panel from '../ui/Panel';
import HelpBox from '../ui/HelpBox';
import Tooltip from '../ui/Tooltip';

type SegmentWithIdx = Segment & { _idx: number };

function filterRelevant(segs: Segment[]): SegmentWithIdx[] {
  return segs
    .map((s, idx) => ({ ...s, _idx: idx }))
    .filter((s) => {
      const t = s.tag || '';
      return (
        t.startsWith('scaffold') ||
        t.startsWith('cycle') ||
        t === 'thinking' ||
        t === 'answer' ||
        t === 'forced_answer' ||
        t === 'answer_prefix' ||
        t === 'post_scaffold' ||
        t === 'post_answer' ||
        t === 'system' ||
        t === 'prompt' ||
        s.source === 'SegmentSource.PROMPT'
      );
    });
}

/* ═══ Animation Controls Bar ═══ */
function AnimationBar({
  anim,
  viewName,
}: {
  anim: ReturnType<typeof useAnimationState>;
  viewName: string;
}) {
  const pct = anim.totalSegments > 0 ? (anim.visibleCount / anim.totalSegments) * 100 : 0;
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,119,187,0.1)',
      }}
    >
      {/* Play / Pause */}
      {anim.done ? (
        <button onClick={anim.reset} style={btnStyle('#0077bb')}>
          ↻ Replay
        </button>
      ) : anim.paused ? (
        <button onClick={anim.resume} style={btnStyle('#0077bb')}>
          ▶ Resume
        </button>
      ) : (
        <button onClick={anim.pause} style={btnStyle('#64748b')}>
          ⏸ Pause
        </button>
      )}

      {/* Reset */}
      <button onClick={anim.reset} style={btnStyle('#475569')}>
        ⏮
      </button>

      {/* Stop — show all */}
      <button onClick={anim.stop} style={btnStyle('#991b1b')}>
        ■ Stop
      </button>

      {/* Skip (group mode) */}
      {anim.queueLen > 1 && !anim.done && (
        <button
          onClick={anim.skipToNext}
          disabled={anim.queuePos >= anim.queueLen - 1}
          style={{
            ...btnStyle('#0369a1'),
            opacity: anim.queuePos >= anim.queueLen - 1 ? 0.4 : 1,
          }}
        >
          ⏭ Skip
        </button>
      )}

      {/* Speed slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Speed</span>
        <input
          type="range"
          min={50}
          max={1500}
          step={50}
          value={1550 - anim.speed}
          onChange={(e) => anim.setSpeed(1550 - Number(e.target.value))}
          style={{ width: 80, accentColor: CB.blue }}
        />
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, minWidth: 36 }}>
          {anim.speed}ms
        </span>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {anim.queueLen > 1 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#0369a1',
              background: '#dbeafe',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            Rollout {anim.queuePos + 1}/{anim.queueLen}
            {viewName ? ` — ${viewName}` : ''}
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>
          Seg {Math.min(anim.visibleCount, anim.totalSegments)}/{anim.totalSegments}
        </span>
        <div
          style={{
            width: 80,
            height: 6,
            background: '#e2e8f0',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: `linear-gradient(90deg,${CB.blue},${CB.cyan})`,
              borderRadius: 3,
              transition: 'width 0.15s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
  };
}

/* ═══ Main ScaffoldTab ═══ */
export default function ScaffoldTab({ row }: { row: Rollout }) {
  const segs = row.segments || [],
    meta = row.metadata || {};
  const [exp, setExp] = useState<Record<number, boolean>>({});
  const [tt, setTt] = useState<TooltipData | null>(null);
  const [ttPos, setTtPos] = useState<TooltipPos>({ x: 0, y: 0 });
  const toggle = (i: number) => setExp((e: Record<number, boolean>) => ({ ...e, [i]: !e[i] }));

  const { animateRequest } = useAppState();
  const dispatch = useAppDispatch();

  const relevant = filterRelevant(segs);

  const tTot = Math.max(
    1,
    relevant.reduce((a, s) => a + (s.token_count || 0), 0),
  );
  const tScaf = relevant
    .filter((s) => (s.tag || '').startsWith('scaffold'))
    .reduce((a, s) => a + (s.token_count || 0), 0);
  const tGen = relevant
    .filter((s) => (s.tag || '').startsWith('cycle') || s.tag === 'thinking')
    .reduce((a, s) => a + (s.token_count || 0), 0);

  // Animation state
  const [animQueue, setAnimQueue] = useState<number[]>([]);
  const anim = useAnimationState(relevant.length, animQueue, dispatch);
  const lastSegRef = useRef<HTMLDivElement | null>(null);

  // Detect animation request from context
  useEffect(() => {
    if (animateRequest) {
      setAnimQueue(animateRequest.queue);
      dispatch({ type: 'CLEAR_ANIMATE_REQUEST' });
    }
  }, [animateRequest, dispatch]);

  // Start playing when queue is set
  useEffect(() => {
    if (animQueue.length > 0 && !anim.active && !anim.done) {
      anim.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animQueue]);

  // Auto-scroll to last visible timeline segment
  useEffect(() => {
    if (anim.active && lastSegRef.current) {
      lastSegRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [anim.active, anim.visibleCount]);

  // Determine which segments to render
  const isAnimating = anim.active || anim.done;
  const visibleRelevant = isAnimating ? relevant.slice(0, anim.visibleCount) : relevant;

  // Compute tTot for visible segments during animation (for proportional widths)
  const visTot = isAnimating
    ? Math.max(
        1,
        visibleRelevant.reduce((a, s) => a + (s.token_count || 0), 0),
      )
    : tTot;

  const viewName = (meta._view_name as string) || '';

  return (
    <div style={{ paddingBottom: 40 }}>
      <Tooltip data={tt} pos={ttPos} />

      {/* Animation controls */}
      {isAnimating && <AnimationBar anim={anim} viewName={viewName} />}

      <HelpBox>
        This tab shows the <strong>interleaved scaffold → generation structure</strong> of ESC-GRPO.
        Segments with diagonal stripes are <strong>masked</strong> (no loss applied). Segments in
        solid colour are <strong>trainable</strong>. Width is strictly proportional to token count.
        Hover any segment for details, click to expand full text.
      </HelpBox>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Chip label="Total Segs" value={relevant.length} bg="#f1f5f9" color={CB.slate} />
        <Chip label="Scaffold" value={tScaf + 't'} bg="#dbeafe" color={CB.blue} />
        <Chip label="Generated" value={tGen + 't'} bg="#dcfce7" color={CB.green} />
        <Chip
          label="Ratio"
          value={tScaf > 0 ? (tGen / tScaf).toFixed(2) + '×' : '∞'}
          bg="#fef3c7"
          color={CB.yellow}
        />
      </div>
      {relevant.length > 0 && (
        <Panel title={`Segment flow (width ∝ tokens, total: ${tTot})`} bc={CB.blue}>
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: 3,
              paddingBottom: 12,
              alignItems: 'stretch',
              minHeight: 80,
              background: '#f8fafc',
              padding: 12,
              borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}
          >
            {visibleRelevant.map((seg, i) => {
              const role = segRole(seg),
                rv = RV[role] || RV.other;
              const pct = (seg.token_count || 0) / visTot;
              const wStr = `max(8px,${pct * 100}%)`;
              const bg = seg.masked
                ? `repeating-linear-gradient(45deg,${rv.bg},${rv.bg} 4px,${rv.bg}aa 4px,${rv.bg}aa 8px)`
                : `linear-gradient(to top,${rv.bg},${rv.bg}e6)`;
              const isNew = isAnimating && i === visibleRelevant.length - 1;
              return (
                <div
                  key={i}
                  onMouseEnter={(e: React.MouseEvent) => {
                    setTtPos({ x: e.clientX, y: e.clientY });
                    setTt({ type: 'segment', ...seg });
                  }}
                  onMouseMove={(e: React.MouseEvent) => setTtPos({ x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTt(null)}
                  onClick={() => toggle(seg._idx)}
                  style={{
                    flexShrink: 0,
                    width: wStr,
                    borderRadius: 4,
                    border: `1px solid ${rv.bg}66`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 2px',
                    overflow: 'hidden',
                    opacity: exp[seg._idx] ? 1 : 0.85,
                    background: bg,
                    boxShadow: isNew ? `0 0 12px ${rv.bg}88` : '0 1px 2px rgba(0,0,0,0.1)',
                    animation: isNew ? 'esc-seg-appear 0.2s ease-out' : undefined,
                  }}
                >
                  {pct > 0.05 && (
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {rv.ic} {(seg.tag || '').replace('scaffold_', 'S').replace('cycle_', 'C')}
                    </div>
                  )}
                  {pct > 0.02 && (
                    <div style={{ fontSize: 8, color: '#ffffffee', fontWeight: 600, marginTop: 2 }}>
                      {seg.token_count}t {seg.masked ? '⊘' : '✓'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginTop: 8,
              justifyContent: 'center',
            }}
          >
            {Object.entries(RV)
              .filter(([k]) =>
                ['system', 'scaffold', 'generated', 'answer', 'forced', 'prefix'].includes(k),
              )
              .map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 10,
                    background: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      background: v.bg,
                      borderRadius: 2,
                      ...(v.stripe
                        ? {
                            backgroundImage:
                              'repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.4) 2px,rgba(255,255,255,0.4) 4px)',
                          }
                        : {}),
                    }}
                  />
                  <span style={{ color: '#475569', fontWeight: 600 }}>
                    {v.ic} {v.lbl}
                  </span>
                </div>
              ))}
          </div>
        </Panel>
      )}
      <Panel title={`Timeline (${relevant.length} segments · click to expand)`} bc={CB.slate}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visibleRelevant.map((seg, i) => {
            const tag = seg.tag || '',
              role = segRole(seg),
              rv = RV[role] || RV.other,
              src = getSrc(seg.source),
              isE = exp[seg._idx];
            const isNew = isAnimating && i === visibleRelevant.length - 1;
            const isLast = i === visibleRelevant.length - 1;
            return (
              <div
                key={i}
                ref={isLast ? lastSegRef : undefined}
                onClick={() => toggle(seg._idx)}
                style={{
                  borderLeft: `4px solid ${rv.bg}`,
                  background: isE ? rv.lt : rv.lt + '88',
                  borderRadius: '0 6px 6px 0',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  borderLeftWidth: 4,
                  borderLeftColor: rv.bg,
                  animation: isNew ? 'esc-seg-appear 0.2s ease-out' : undefined,
                  boxShadow: isNew ? `0 0 8px ${rv.bg}44` : undefined,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: rv.bg === '#bbbbbb' ? '#334155' : rv.bg,
                      background: tagBg(tag),
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {rv.ic} {tag}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: src.bg,
                      border: `1px solid ${src.bd}`,
                      color: '#334155',
                      fontWeight: 600,
                    }}
                  >
                    {src.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#475569',
                      fontWeight: 600,
                      background: '#fff',
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    {seg.token_count || 0} toks
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: seg.masked ? CB.red : CB.green,
                      fontWeight: 700,
                      background: seg.masked ? '#fee2e2' : '#dcfce7',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {seg.masked ? '⊘ MASKED' : '✓ TRAINABLE'}
                  </span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', fontWeight: 600 }}
                  >
                    #{seg._idx} {isE ? '▲' : '▼'}
                  </span>
                </div>
                {!isE && (
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: '#64748b',
                      marginTop: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {(seg.text || '').replace(/\n/g, '↵').slice(0, 140)}
                  </div>
                )}
                {isE && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        color: '#0f172a',
                        whiteSpace: 'pre-wrap',
                        maxHeight: 250,
                        overflow: 'auto',
                        background: '#ffffffcc',
                        padding: 10,
                        borderRadius: 6,
                        lineHeight: 1.6,
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {seg.text || '(empty)'}
                    </div>
                    {seg.context_before && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 10,
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: 8,
                          borderRadius: 6,
                          border: '1px dashed #cbd5e1',
                        }}
                      >
                        <strong>Context:</strong> …{(seg.context_before || '').slice(-200)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
