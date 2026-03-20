import { describe, it, expect } from 'vitest';
import { fmtIter, iterParts } from './format';

describe('fmtIter', () => {
  it('returns dash for null/undefined', () => {
    expect(fmtIter(null)).toBe('—');
    expect(fmtIter(undefined)).toBe('—');
  });

  it('formats integer steps without substep', () => {
    expect(fmtIter(0)).toBe('0');
    expect(fmtIter(5)).toBe('5');
    expect(fmtIter(100)).toBe('100');
  });

  it('formats fractional steps with substep', () => {
    expect(fmtIter(1.1)).toBe('1.1');
    expect(fmtIter(3.5)).toBe('3.5');
    expect(fmtIter(7.9)).toBe('7.9');
  });

  it('drops substep when it rounds to 0', () => {
    expect(fmtIter(2.0)).toBe('2');
    expect(fmtIter(2.001)).toBe('2');
  });
});

describe('iterParts', () => {
  it('returns {step:0, sub:0} for null/undefined', () => {
    expect(iterParts(null)).toEqual({ step: 0, sub: 0 });
    expect(iterParts(undefined)).toEqual({ step: 0, sub: 0 });
  });

  it('splits integer iteration', () => {
    expect(iterParts(5)).toEqual({ step: 5, sub: 0 });
  });

  it('splits fractional iteration', () => {
    expect(iterParts(3.7)).toEqual({ step: 3, sub: 7 });
    expect(iterParts(1.2)).toEqual({ step: 1, sub: 2 });
  });
});
