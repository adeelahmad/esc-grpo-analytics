import React from 'react';
import type { SegmentWithIdx } from '../utils/segments';
import { segRole, RV } from '../constants/colors';

interface Props {
  segments: SegmentWithIdx[];
  visibleCount: number;
}

/**
 * Segment flow bar for Remotion video — mirrors ScaffoldTab's segment flow
 * but driven by visibleCount prop (from useCurrentFrame).
 */
export default function SegmentFlowScene({ segments, visibleCount }: Props) {
  const visible = segments.slice(0, visibleCount);
  const visTot = Math.max(
    1,
    visible.reduce((a, s) => a + (s.token_count || 0), 0),
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
        minHeight: 80,
        alignItems: 'stretch',
      }}
    >
      {visible.map((seg, i) => {
        const role = segRole(seg),
          rv = RV[role] || RV.other;
        const pct = (seg.token_count || 0) / visTot;
        const wStr = `max(8px,${pct * 100}%)`;
        const bg = seg.masked
          ? `repeating-linear-gradient(45deg,${rv.bg},${rv.bg} 4px,${rv.bg}aa 4px,${rv.bg}aa 8px)`
          : `linear-gradient(to top,${rv.bg},${rv.bg}e6)`;
        const isNew = i === visible.length - 1;
        return (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: wStr,
              borderRadius: 4,
              border: `1px solid ${rv.bg}66`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 2px',
              overflow: 'hidden',
              opacity: 0.85,
              background: bg,
              boxShadow: isNew ? `0 0 12px ${rv.bg}88` : '0 1px 2px rgba(0,0,0,0.1)',
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
  );
}
