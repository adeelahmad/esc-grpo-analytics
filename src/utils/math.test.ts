import { describe, it, expect } from 'vitest';
import { safeMax, safeMin } from './math';

describe('safeMax', () => {
  it('returns max of array', () => {
    expect(safeMax([1, 5, 3])).toBe(5);
  });

  it('works with negative numbers', () => {
    expect(safeMax([-10, -3, -7])).toBe(-3);
  });

  it('works with single element', () => {
    expect(safeMax([42])).toBe(42);
  });

  it('returns -Infinity for empty array', () => {
    expect(safeMax([])).toBe(-Infinity);
  });

  it('handles large arrays without stack overflow', () => {
    const large = Array.from({ length: 50000 }, (_, i) => i);
    expect(safeMax(large)).toBe(49999);
  });
});

describe('safeMin', () => {
  it('returns min of array', () => {
    expect(safeMin([1, 5, 3])).toBe(1);
  });

  it('works with negative numbers', () => {
    expect(safeMin([-10, -3, -7])).toBe(-10);
  });

  it('works with single element', () => {
    expect(safeMin([42])).toBe(42);
  });

  it('returns Infinity for empty array', () => {
    expect(safeMin([])).toBe(Infinity);
  });

  it('handles large arrays without stack overflow', () => {
    const large = Array.from({ length: 50000 }, (_, i) => i);
    expect(safeMin(large)).toBe(0);
  });
});
