import React from 'react';
import type { SegmentWithIdx } from '../utils/segments';
import { segRole, RV, CB, getSrc, tagBg } from '../constants/colors';

interface Props {
  segments: SegmentWithIdx[];
  visibleCount: number;
}

/**
 * Timeline segment list for Remotion video — mirrors ScaffoldTab's timeline
 * but driven by visibleCount prop (from useCurrentFrame).
 */
export default function TimelineScene({ segments, visibleCount }: Props) {
  const visible = segments.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {visible.map((seg, i) => {
        const tag = seg.tag || '',
          role = segRole(seg),
          rv = RV[role] || RV.other,
          src = getSrc(seg.source);
        const isNew = i === visible.length - 1;
        return (
          <div
            key={i}
            style={{
              borderLeft: `4px solid ${rv.bg}`,
              background: rv.lt + '88',
              borderRadius: '0 6px 6px 0',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderLeftWidth: 4,
              borderLeftColor: rv.bg,
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
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                #{seg._idx}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#64748b',
                marginTop: 6,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {(seg.text || '').replace(/\n/g, '↵').slice(0, 140)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
