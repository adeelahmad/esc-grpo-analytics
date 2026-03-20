import { describe, it, expect } from 'vitest';
import { CB, proxGrad, wColor, segRole, getSrc, tagBg } from './colors';

describe('CB palette', () => {
  it('contains expected color keys', () => {
    expect(CB.blue).toBe('#0077bb');
    expect(CB.red).toBe('#cc3311');
    expect(CB.green).toBe('#009988');
  });
});

describe('proxGrad', () => {
  it('returns hsl string for weight 0', () => {
    const result = proxGrad(0);
    expect(result).toMatch(/^hsl\(/);
    expect(result).toContain('0,');
  });

  it('returns saturated for high weight', () => {
    const result = proxGrad(3.6);
    expect(result).toMatch(/^hsl\(130/);
  });

  it('clamps at 3.6', () => {
    expect(proxGrad(10)).toBe(proxGrad(3.6));
  });
});

describe('wColor', () => {
  it('returns red for very low weights', () => {
    expect(wColor(0)).toBe(CB.red);
    expect(wColor(0.5)).toBe(CB.red);
  });

  it('returns orange for low weights', () => {
    expect(wColor(1.0)).toBe(CB.orange);
  });

  it('returns green for high weights', () => {
    expect(wColor(3.5)).toBe(CB.green);
  });
});

describe('segRole', () => {
  it('returns "other" for null/undefined', () => {
    expect(segRole(null)).toBe('other');
    expect(segRole(undefined)).toBe('other');
  });

  it('identifies system segments', () => {
    expect(segRole({ tag: 'system' })).toBe('system');
    expect(segRole({ tag: 'prompt' })).toBe('system');
    expect(segRole({ source: 'SegmentSource.PROMPT' })).toBe('system');
  });

  it('identifies scaffold segments', () => {
    expect(segRole({ tag: 'scaffold_start' })).toBe('scaffold');
    expect(segRole({ tag: 'scaffold' })).toBe('scaffold');
  });

  it('identifies generated segments', () => {
    expect(segRole({ tag: 'cycle1' })).toBe('generated');
    expect(segRole({ tag: 'thinking' })).toBe('generated');
  });

  it('identifies forced answer', () => {
    expect(segRole({ tag: 'forced_answer' })).toBe('forced');
  });

  it('identifies answer', () => {
    expect(segRole({ tag: 'answer' })).toBe('answer');
  });

  it('identifies prefix', () => {
    expect(segRole({ tag: 'answer_prefix' })).toBe('prefix');
  });

  it('identifies post', () => {
    expect(segRole({ tag: 'post_scaffold' })).toBe('post');
    expect(segRole({ tag: 'post_answer' })).toBe('post');
  });

  it('identifies injected', () => {
    expect(segRole({ source: 'injected' })).toBe('injected');
  });
});

describe('getSrc', () => {
  it('returns prompt visual for PROMPT source', () => {
    expect(getSrc('SegmentSource.PROMPT').label).toBe('PROMPT');
  });

  it('returns default for unknown source', () => {
    expect(getSrc('xyz').label).toBe('?');
  });

  it('returns default for undefined', () => {
    expect(getSrc(undefined).label).toBe('?');
  });
});

describe('tagBg', () => {
  it('returns default grey for empty/undefined tag', () => {
    expect(tagBg(undefined)).toBe('#e5e7eb');
    expect(tagBg('')).toBe('#e5e7eb');
  });

  it('returns blue for scaffold tags', () => {
    expect(tagBg('scaffold_start')).toBe('#bfdbfe');
  });

  it('returns green for cycle tags', () => {
    expect(tagBg('cycle1')).toBe('#bbf7d0');
  });

  it('returns purple for thinking', () => {
    expect(tagBg('thinking')).toBe('#e9d5ff');
  });

  it('returns orange for forced_answer', () => {
    expect(tagBg('forced_answer')).toBe('#fed7aa');
  });
});
