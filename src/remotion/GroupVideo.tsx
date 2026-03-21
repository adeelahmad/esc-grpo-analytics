import React from 'react';
import { Series } from 'remotion';
import type { Rollout } from '../types';
import { filterRelevant } from '../utils/segments';
import { getTotalTokens } from './StreamScene';
import {
  framesPerToken,
  PAUSE_FRAMES,
  SUMMARY_FRAMES,
  DEFAULT_TOKENS_PER_SEC,
  VIDEO_FPS,
} from './constants';
import RolloutVideo from './RolloutVideo';

export interface GroupVideoProps {
  rollouts: Rollout[];
  tokPerSec?: number;
}

/**
 * Remotion composition for a group of rollouts played in sequence.
 * Uses Remotion's <Series> to chain rollout animations with pauses between.
 */
export default function GroupVideo({
  rollouts,
  tokPerSec = DEFAULT_TOKENS_PER_SEC,
}: GroupVideoProps) {
  const fpTok = framesPerToken(tokPerSec, VIDEO_FPS);

  return (
    <Series>
      {rollouts.map((rollout, i) => {
        const segments = filterRelevant(rollout.segments || []);
        const totalTokens = getTotalTokens(segments);
        const duration = totalTokens * fpTok + SUMMARY_FRAMES;
        const isLast = i === rollouts.length - 1;
        return (
          <React.Fragment key={i}>
            <Series.Sequence durationInFrames={duration}>
              <RolloutVideo rollout={rollout} tokPerSec={tokPerSec} />
            </Series.Sequence>
            {!isLast && <Series.Sequence durationInFrames={PAUSE_FRAMES} />}
          </React.Fragment>
        );
      })}
    </Series>
  );
}

/** Calculate total frames for a group video. */
export function calcGroupDuration(rollouts: Rollout[], tokPerSec: number): number {
  const fpTok = framesPerToken(tokPerSec, VIDEO_FPS);
  return rollouts.reduce((total, rollout, i) => {
    const segments = filterRelevant(rollout.segments || []);
    const totalTokens = getTotalTokens(segments);
    const pause = i < rollouts.length - 1 ? PAUSE_FRAMES : 0;
    return total + totalTokens * fpTok + SUMMARY_FRAMES + pause;
  }, 0);
}
