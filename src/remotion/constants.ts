/** Default video configuration for Remotion compositions. */

export const VIDEO_FPS = 30;

export const RESOLUTION = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
} as const;

export type ResolutionKey = keyof typeof RESOLUTION;

/**
 * Tokens per second streaming speed — controls how fast text appears.
 * At 40 tok/s, a 500-token segment takes ~12.5s.
 */
export const DEFAULT_TOKENS_PER_SEC = 40;

/** Frames of pause between rollouts in a group sequence. */
export const PAUSE_FRAMES = 45; // 1.5s at 30fps

/** Frames for the end summary screen. */
export const SUMMARY_FRAMES = 150; // 5s at 30fps

/** Convert tokens-per-second to frames-per-token at a given fps. */
export function framesPerToken(tokPerSec: number, fps = VIDEO_FPS): number {
  return Math.max(1, Math.round(fps / tokPerSec));
}

/** Calculate total duration in frames for a single rollout (streaming + summary). */
export function rolloutDurationFrames(
  totalTokens: number,
  tokPerSec: number,
  fps = VIDEO_FPS,
): number {
  const fpTok = framesPerToken(tokPerSec, fps);
  return totalTokens * fpTok + SUMMARY_FRAMES;
}

/** Calculate total duration for a group sequence (multiple rollouts). */
export function groupDurationFrames(
  tokenCounts: number[],
  tokPerSec: number,
  fps = VIDEO_FPS,
): number {
  const fpTok = framesPerToken(tokPerSec, fps);
  return tokenCounts.reduce((total, count, i) => {
    const pause = i < tokenCounts.length - 1 ? PAUSE_FRAMES : 0;
    return total + count * fpTok + SUMMARY_FRAMES + pause;
  }, 0);
}
