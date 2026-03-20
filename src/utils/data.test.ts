import { describe, it, expect } from 'vitest';
import { isForced, forcedStats } from './data';
import type { Rollout, Segment } from '../types';

describe('isForced', () => {
  it('returns false for null/undefined', () => {
    expect(isForced(null)).toBe(false);
    expect(isForced(undefined)).toBe(false);
  });

  it('returns false when no forced metadata', () => {
    const r: Rollout = { metadata: {} };
    expect(isForced(r)).toBe(false);
  });

  it('returns true when _esc_forced_answer is truthy', () => {
    const r: Rollout = { metadata: { _esc_forced_answer: true } };
    expect(isForced(r)).toBe(true);
  });

  it('returns false when _esc_forced_answer is false', () => {
    const r: Rollout = { metadata: { _esc_forced_answer: false } };
    expect(isForced(r)).toBe(false);
  });

  it('handles missing metadata', () => {
    const r: Rollout = {};
    expect(isForced(r)).toBe(false);
  });
});

describe('forcedStats', () => {
  it('returns null for undefined segments', () => {
    expect(forcedStats(undefined)).toBeNull();
  });

  it('returns null for empty segments', () => {
    expect(forcedStats([])).toBeNull();
  });

  it('returns null when no forced_answer segments', () => {
    const segs: Segment[] = [{ tag: 'scaffold', token_count: 10 }];
    expect(forcedStats(segs)).toBeNull();
  });

  it('computes stats for forced_answer segments', () => {
    const segs: Segment[] = [
      { tag: 'forced_answer', token_count: 20, masked: true, source: 'injected' },
      { tag: 'forced_answer', token_count: 10, masked: true },
    ];
    const stats = forcedStats(segs);
    expect(stats).toEqual({
      count: 2,
      toks: 30,
      masked: true,
      partial: false,
      injected: true,
    });
  });

  it('detects partial masking', () => {
    const segs: Segment[] = [
      { tag: 'forced_answer', token_count: 10, masked: true },
      { tag: 'forced_answer', token_count: 5, masked: false },
    ];
    const stats = forcedStats(segs);
    expect(stats!.masked).toBe(false);
    expect(stats!.partial).toBe(true);
  });

  it('handles segments with no token_count', () => {
    const segs: Segment[] = [{ tag: 'forced_answer' }];
    const stats = forcedStats(segs);
    expect(stats).toEqual({
      count: 1,
      toks: 0,
      masked: false,
      partial: false,
      injected: false,
    });
  });
});
