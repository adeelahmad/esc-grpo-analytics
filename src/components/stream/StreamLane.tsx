import React, { useMemo, useRef, useEffect } from 'react';
import type { SegmentWithIdx } from '../../utils/segments';
import type { StreamToken } from '../../utils/tokenize';
import { flattenSegmentsToTokens } from '../../utils/tokenize';
import { CB } from '../../constants/colors';

/** Gutter color config keyed by role. */
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
      {masked && <span style={{ marginLeft: 3, opacity: 0.8 }}>&#x2298; MASKED</span>}
    </span>
  );
}

interface StreamLaneProps {
  segments: SegmentWithIdx[];
  visibleTokens: number;
  label?: string;
  headerColor?: string;
  streaming?: boolean; // whether the stream is currently animating
}

/**
 * Terminal-style streaming text display with colored side gutter,
 * inline transition badges, and a blinking cursor.
 */
export default function StreamLane({
  segments,
  visibleTokens,
  label,
  headerColor,
  streaming = false,
}: StreamLaneProps) {
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  const tokens: StreamToken[] = useMemo(() => flattenSegmentsToTokens(segments), [segments]);

  const visible = tokens.slice(0, visibleTokens);

  // Group visible tokens by segment for gutter rendering
  const groups = useMemo(() => {
    const result: {
      role: string;
      masked: boolean;
      isFirstInSeg: boolean;
      tokens: StreamToken[];
    }[] = [];
    let current: (typeof result)[0] | null = null;
    visible.forEach((tok) => {
      if (!current || tok.segIdx !== current.tokens[0]?.segIdx) {
        current = {
          role: tok.role,
          masked: tok.masked,
          isFirstInSeg: true,
          tokens: [],
        };
        result.push(current);
      }
      current.tokens.push(tok);
    });
    return result;
  }, [visible]);

  // Auto-scroll to cursor
  useEffect(() => {
    if (streaming && cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [streaming, visibleTokens]);

  const totalTokens = tokens.length;
  const isDone = visibleTokens >= totalTokens;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        border: headerColor ? `1.5px solid ${headerColor}33` : '1px solid #334155',
      }}
    >
      {/* Header */}
      {label && (
        <div
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: headerColor || '#94a3b8',
            background: '#1e293b',
            borderBottom: `2px solid ${headerColor || '#334155'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{label}</span>
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
            {visibleTokens}/{totalTokens} tokens
          </span>
        </div>
      )}

      {/* Stream body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#0f172a',
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
          fontSize: 13,
          lineHeight: '22px',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 0',
          }}
        >
          {groups.map((group, gi) => {
            const g = GUTTER[group.role] || GUTTER.other;
            return (
              <div
                key={gi}
                style={{
                  display: 'flex',
                  minHeight: 22,
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
                  {group.isFirstInSeg && (
                    <TransitionBadge role={group.role} masked={group.masked} />
                  )}
                  {group.tokens.map((tok, ti) => (
                    <span
                      key={ti}
                      style={{
                        // Highlight the most recent token with a subtle glow
                        ...(streaming && gi === groups.length - 1 && ti === group.tokens.length - 1
                          ? {
                              animation: 'esc-token-appear 0.08s ease-out',
                              background: `${g.color}22`,
                              borderRadius: 2,
                            }
                          : {}),
                      }}
                    >
                      {tok.text}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Blinking cursor */}
          {streaming && !isDone && (
            <span
              ref={cursorRef}
              style={{
                display: 'inline-block',
                width: 2,
                height: 16,
                background: '#38bdf8',
                marginLeft: 16,
                verticalAlign: 'middle',
                animation: 'esc-cursor-blink 1s step-end infinite',
              }}
            />
          )}

          {/* Done indicator */}
          {isDone && totalTokens > 0 && (
            <div
              style={{
                padding: '8px 16px',
                fontSize: 10,
                color: '#4ade80',
                fontWeight: 700,
                opacity: 0.7,
              }}
            >
              --- stream complete ({totalTokens} tokens) ---
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
