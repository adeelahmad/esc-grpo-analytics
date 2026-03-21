import React from 'react';
import { useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import type { Rollout } from '../types';
import { filterRelevant } from '../utils/segments';
import { framesPerToken, DEFAULT_TOKENS_PER_SEC, SUMMARY_FRAMES } from './constants';
import { CB } from '../constants/colors';
import StreamScene, { getTotalTokens } from './StreamScene';
import SummaryScene from './SummaryScene';

export interface RolloutVideoProps {
  rollout: Rollout;
  tokPerSec?: number;
}

/**
 * Remotion composition for a single rollout animation.
 * Phase 1: Streaming text scroll (tokens appear one-by-one)
 * Phase 2: Summary screen with stats and breakdown
 */
export default function RolloutVideo({
  rollout,
  tokPerSec = DEFAULT_TOKENS_PER_SEC,
}: RolloutVideoProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segments = filterRelevant(rollout.segments || []);
  const totalTokens = getTotalTokens(segments);
  const fpTok = framesPerToken(tokPerSec, fps);
  const streamFrames = totalTokens * fpTok;

  const meta = rollout.metadata || {};
  const viewName = (meta._view_name as string) || '';

  // During streaming phase, calculate visible tokens from frame
  const visibleTokens = Math.min(totalTokens, Math.floor(frame / fpTok) + 1);
  const isStreaming = frame < streamFrames;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0f172a',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {isStreaming ? (
        <>
          {/* Header bar during streaming */}
          <div
            style={{
              padding: '8px 24px',
              background: '#1e293b',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            {viewName && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: '#0c4a6e',
                  padding: '3px 10px',
                  borderRadius: 4,
                }}
              >
                {viewName}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
              {visibleTokens} / {totalTokens} tokens
            </span>
            {/* Progress bar */}
            <div
              style={{
                flex: 1,
                maxWidth: 200,
                height: 4,
                background: '#334155',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(visibleTokens / totalTokens) * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg,${CB.blue},${CB.cyan})`,
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
              {rollout.correct ? '✓' : '✗'} reward: {(rollout.reward ?? 0).toFixed(3)}
            </span>
          </div>
          {/* Streaming content */}
          <div style={{ flex: 1, padding: '0 24px 24px 24px', overflow: 'hidden' }}>
            <StreamScene segments={segments} visibleTokens={visibleTokens} />
          </div>
        </>
      ) : (
        /* Summary screen */
        <Sequence from={streamFrames} durationInFrames={SUMMARY_FRAMES}>
          <SummaryScene rollout={rollout} segments={segments} />
        </Sequence>
      )}
    </div>
  );
}
