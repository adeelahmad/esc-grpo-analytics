import React, { useMemo } from 'react';
import type { SegmentWithIdx } from '../utils/segments';
import { segRole, CB } from '../constants/colors';
import { interpolate, useCurrentFrame } from 'remotion';

/** A single displayable token with its segment context. */
interface StreamToken {
  text: string;
  segIdx: number;
  seg: SegmentWithIdx;
  role: string;
  masked: boolean;
  isFirstInSeg: boolean;
}

/** Gutter color config keyed by category. */
const GUTTER: Record<string, { color: string; label: string }> = {
  injected: { color: CB.blue, label: 'INJECTED' },
  scaffold: { color: CB.blue, label: 'SCAFFOLD' },
  generated: { color: CB.green, label: 'GENERATED' },
  system: { color: CB.slate, label: 'SYSTEM' },
  answer: { color: CB.yellow, label: 'ANSWER' },
  forced: { color: CB.orange, label: 'FORCED' },
  prefix: { color: CB.purple, label: 'PREFIX' },
  post: { color: '#6b7280', label: 'POST' },
  other: { color: '#9ca3af', label: 'OTHER' },
};

/** Badge shown at segment transitions. */
function TransitionBadge({ role, masked }: { role: string; masked: boolean }) {
  const g = GUTTER[role] || GUTTER.other;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 9,
        fontWeight: 700,
        color: '#fff',
        background: g.color,
        padding: '1px 6px',
        borderRadius: 3,
        marginRight: 4,
        verticalAlign: 'middle',
      }}
    >
      {g.label}
      {masked && (
        <span style={{ marginLeft: 3, opacity: 0.8 }}>⊘ MASKED</span>
      )}
    </span>
  );
}

interface StreamSceneProps {
  segments: SegmentWithIdx[];
  visibleTokens: number;
}

/**
 * Streaming text scene — shows tokens appearing continuously like a terminal,
 * with a colored side gutter indicating segment type and inline badges at transitions.
 */
export default function StreamScene({ segments, visibleTokens }: StreamSceneProps) {
  // Flatten segments into individual tokens (approximated by splitting text into words/chunks)
  const tokens: StreamToken[] = useMemo(() => {
    const result: StreamToken[] = [];
    segments.forEach((seg, segIdx) => {
      const text = seg.text || '';
      const role = segRole(seg);
      const masked = !!seg.masked;
      // Split into word-level tokens (approximate since we don't have actual token boundaries)
      // Use whitespace-preserving split to keep formatting
      const chunks = text.match(/\S+\s*/g) || [text || ' '];
      // Scale chunks to match token_count if available
      const tokenCount = seg.token_count || chunks.length;
      // Distribute chunks evenly across the token count
      const chunkPerToken = chunks.length / Math.max(1, tokenCount);
      for (let t = 0; t < tokenCount; t++) {
        const chunkStart = Math.floor(t * chunkPerToken);
        const chunkEnd = Math.floor((t + 1) * chunkPerToken);
        const tokenText = chunks.slice(chunkStart, chunkEnd).join('');
        result.push({
          text: tokenText || '',
          segIdx,
          seg,
          role,
          masked,
          isFirstInSeg: t === 0,
        });
      }
    });
    return result;
  }, [segments]);

  const visible = tokens.slice(0, visibleTokens);

  // Group visible tokens by segment for gutter rendering
  const lines: { role: string; masked: boolean; isFirstInSeg: boolean; tokens: StreamToken[] }[] =
    (() => {
      const groups: { role: string; masked: boolean; isFirstInSeg: boolean; tokens: StreamToken[] }[] = [];
      let current: (typeof groups)[0] | null = null;
      visible.forEach((tok) => {
        if (!current || tok.segIdx !== current.tokens[0]?.segIdx) {
          current = {
            role: tok.role,
            masked: tok.masked,
            isFirstInSeg: true,
            tokens: [],
          };
          groups.push(current);
        }
        current.tokens.push(tok);
      });
      return groups;
    })();

  // Calculate scroll offset to keep latest content visible
  const frame = useCurrentFrame();
  const lineHeight = 22;
  const maxVisibleLines = 24;

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        background: '#0f172a',
        borderRadius: 8,
        fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
        fontSize: 13,
        lineHeight: `${lineHeight}px`,
        position: 'relative',
      }}
    >
      {/* Scrolling content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          transform: `translateY(-${Math.max(0, (lines.length - maxVisibleLines) * (lineHeight + 4))}px)`,
          transition: 'transform 0.1s linear',
        }}
      >
        {lines.map((group, gi) => {
          const g = GUTTER[group.role] || GUTTER.other;
          const textContent = group.tokens.map((t) => t.text).join('');
          return (
            <div
              key={gi}
              style={{
                display: 'flex',
                minHeight: lineHeight,
                paddingLeft: 0,
              }}
            >
              {/* Side gutter */}
              <div
                style={{
                  width: 4,
                  flexShrink: 0,
                  background: g.color,
                  borderRadius: '2px 0 0 2px',
                  opacity: group.masked ? 0.4 : 1,
                }}
              />
              {/* Content */}
              <div
                style={{
                  flex: 1,
                  padding: '2px 12px',
                  color: group.masked ? '#64748b' : '#e2e8f0',
                  textDecoration: group.masked ? 'line-through' : 'none',
                  textDecorationColor: group.masked ? '#475569' : undefined,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {/* Transition badge at segment start */}
                {group.isFirstInSeg && (
                  <TransitionBadge role={group.role} masked={group.masked} />
                )}
                {textContent}
              </div>
            </div>
          );
        })}
        {/* Blinking cursor */}
        {visibleTokens < tokens.length && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: 16,
              background: '#38bdf8',
              marginLeft: 16,
              opacity: interpolate(frame % 30, [0, 15, 16, 30], [1, 1, 0.2, 0.2]),
              verticalAlign: 'middle',
            }}
          />
        )}
      </div>
    </div>
  );
}

/** Get total token count across segments. */
export function getTotalTokens(segments: SegmentWithIdx[]): number {
  return segments.reduce((sum, s) => sum + (s.token_count || 1), 0);
}
