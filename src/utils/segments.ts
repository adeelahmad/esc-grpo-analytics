import type { Segment } from '../types';

export type SegmentWithIdx = Segment & { _idx: number };

/** Filter segments to only those relevant for scaffold visualization. */
export function filterRelevant(segs: Segment[]): SegmentWithIdx[] {
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
