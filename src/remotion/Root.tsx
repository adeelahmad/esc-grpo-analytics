import React from 'react';
import { Composition } from 'remotion';
import RolloutVideo from './RolloutVideo';
import GroupVideo from './GroupVideo';
import { VIDEO_FPS, RESOLUTION } from './constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Remotion root — registers all compositions for rendering.
 * Used by Remotion CLI and bundler.
 *
 * Components are cast to `any` because Remotion's Composition expects
 * `Record<string, unknown>` but our components have typed props.
 * The defaultProps ensure all required values are provided.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RolloutVideo"
        component={RolloutVideo as any}
        durationInFrames={300}
        fps={VIDEO_FPS}
        width={RESOLUTION['1080p'].width}
        height={RESOLUTION['1080p'].height}
        defaultProps={{
          rollout: { segments: [] },
          tokPerSec: 40,
        }}
      />
      <Composition
        id="GroupVideo"
        component={GroupVideo as any}
        durationInFrames={600}
        fps={VIDEO_FPS}
        width={RESOLUTION['1080p'].width}
        height={RESOLUTION['1080p'].height}
        defaultProps={{
          rollouts: [],
          tokPerSec: 40,
        }}
      />
    </>
  );
};
