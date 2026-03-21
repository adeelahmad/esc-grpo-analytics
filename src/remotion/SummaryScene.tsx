import React from 'react';
import type { Rollout } from '../types';
import type { SegmentWithIdx } from '../utils/segments';
import { segRole, RV, CB } from '../constants/colors';
import { interpolate, useCurrentFrame } from 'remotion';

interface SummarySceneProps {
  rollout: Rollout;
  segments: SegmentWithIdx[];
}

/**
 * End-of-video summary screen showing:
 * - Reward, advantage, correctness
 * - Total tokens, trainable vs masked counts
 * - Per-segment breakdown table
 */
export default function SummaryScene({ rollout, segments }: SummarySceneProps) {
  const frame = useCurrentFrame();
  const meta = rollout.metadata || {};
  const viewName = (meta._view_name as string) || '';

  // Calculate stats
  const totalTokens = segments.reduce((s, seg) => s + (seg.token_count || 0), 0);
  const trainableTokens = segments
    .filter((s) => !s.masked)
    .reduce((s, seg) => s + (seg.token_count || 0), 0);
  const maskedTokens = totalTokens - trainableTokens;
  const trainablePct = totalTokens > 0 ? ((trainableTokens / totalTokens) * 100).toFixed(1) : '0';
  const maskedPct = totalTokens > 0 ? ((maskedTokens / totalTokens) * 100).toFixed(1) : '0';

  // Fade-in for the summary
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const slideUp = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        opacity,
        transform: `translateY(${slideUp}px)`,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ color: '#38bdf8' }}>Summary</span>
        {viewName && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#94a3b8',
              background: '#1e293b',
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid #334155',
            }}
          >
            {viewName}
          </span>
        )}
      </div>

      {/* Hero stats row */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <StatCard
          label="Reward"
          value={(rollout.reward ?? 0).toFixed(3)}
          color={CB.green}
          frame={frame}
          delay={5}
        />
        <StatCard
          label="Advantage"
          value={(rollout.advantage ?? 0).toFixed(3)}
          color={(rollout.advantage ?? 0) >= 0 ? CB.green : CB.red}
          frame={frame}
          delay={8}
        />
        <StatCard
          label="Correct"
          value={rollout.correct ? 'YES' : 'NO'}
          color={rollout.correct ? CB.green : CB.red}
          frame={frame}
          delay={11}
        />
        <StatCard
          label="Total Tokens"
          value={String(totalTokens)}
          color={CB.cyan}
          frame={frame}
          delay={14}
        />
      </div>

      {/* Token breakdown bar */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#94a3b8',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Loss Contribution
        </div>
        <div
          style={{
            display: 'flex',
            height: 32,
            borderRadius: 6,
            overflow: 'hidden',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              width: `${trainablePct}%`,
              background: `linear-gradient(90deg, ${CB.green}, ${CB.cyan})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              transition: 'width 0.3s',
            }}
          >
            {trainableTokens}t TRAINABLE ({trainablePct}%)
          </div>
          <div
            style={{
              width: `${maskedPct}%`,
              background: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#64748b',
            }}
          >
            {maskedTokens}t MASKED ({maskedPct}%)
          </div>
        </div>
      </div>

      {/* Segment breakdown table */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#94a3b8',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Segment Breakdown
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 80px 80px 100px',
            gap: '2px 0',
            fontSize: 11,
            maxHeight: '100%',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={headerCell}>#</div>
          <div style={headerCell}>Tag</div>
          <div style={headerCell}>Tokens</div>
          <div style={headerCell}>Status</div>
          <div style={headerCell}>Proportion</div>

          {/* Rows */}
          {segments.map((seg, i) => {
            const role = segRole(seg);
            const rv = RV[role] || RV.other;
            const pct = totalTokens > 0 ? ((seg.token_count || 0) / totalTokens) * 100 : 0;
            const rowDelay = 20 + i * 2;
            const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 5], [0, 1], {
              extrapolateRight: 'clamp',
              extrapolateLeft: 'clamp',
            });
            return (
              <React.Fragment key={i}>
                <div style={{ ...dataCell, opacity: rowOpacity, color: '#64748b' }}>{i + 1}</div>
                <div style={{ ...dataCell, opacity: rowOpacity }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: rv.bg,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  {rv.ic} {seg.tag || 'unknown'}
                </div>
                <div
                  style={{
                    ...dataCell,
                    opacity: rowOpacity,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {seg.token_count || 0}
                </div>
                <div style={{ ...dataCell, opacity: rowOpacity }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 3,
                      background: seg.masked ? '#1e293b' : '#064e3b',
                      color: seg.masked ? '#64748b' : CB.green,
                      border: `1px solid ${seg.masked ? '#334155' : '#065f46'}`,
                    }}
                  >
                    {seg.masked ? '⊘ MASKED' : '✓ TRAIN'}
                  </span>
                </div>
                <div style={{ ...dataCell, opacity: rowOpacity }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: '#1e293b',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: seg.masked ? '#475569' : rv.bg,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: '#64748b', marginLeft: 4 }}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Shaped reward info */}
      {meta._esc_shaped_reward !== undefined && (
        <div
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#1e293b',
            borderRadius: 6,
            border: '1px solid #334155',
            fontSize: 12,
            color: '#94a3b8',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>
            Shaped Reward:{' '}
            <strong style={{ color: CB.yellow }}>
              {(meta._esc_shaped_reward as number).toFixed(4)}
            </strong>
          </span>
          {meta.reward_multiplier !== undefined && (
            <span>
              Multiplier:{' '}
              <strong style={{ color: CB.cyan }}>
                {(meta.reward_multiplier as number).toFixed(3)}
              </strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  frame,
  delay,
}: {
  label: string;
  value: string;
  color: string;
  frame: number;
  delay: number;
}) {
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const scale = interpolate(frame, [delay, delay + 8], [0.9, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  return (
    <div
      style={{
        background: '#1e293b',
        border: `1px solid ${color}44`,
        borderRadius: 8,
        padding: '12px 20px',
        minWidth: 120,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const headerCell: React.CSSProperties = {
  padding: '6px 8px',
  fontWeight: 700,
  color: '#64748b',
  borderBottom: '1px solid #334155',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontSize: 10,
};

const dataCell: React.CSSProperties = {
  padding: '4px 8px',
  borderBottom: '1px solid #1e293b',
  color: '#cbd5e1',
  display: 'flex',
  alignItems: 'center',
};
