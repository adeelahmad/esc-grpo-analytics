import type { ForcedStats, Rollout, Segment } from '../types';

/* Is this row's answer forced? */
export const isForced = (r: Rollout | null | undefined): boolean =>
  !!(r?.metadata || {} as Record<string, unknown>)._esc_forced_answer;

/* Forced answer segment stats from segments array */
export const forcedStats = (segs: Segment[] | undefined): ForcedStats | null => {
  const f = (segs || []).filter(s => s.tag === 'forced_answer');
  if (!f.length) return null;
  const toks = f.reduce((a, s) => a + (s.token_count || 0), 0);
  const masked = f.every(s => s.masked);
  const partial = f.some(s => s.masked) && !masked;
  const injected = f.some(s => s.source === 'injected');
  return { count: f.length, toks, masked, partial, injected };
};
