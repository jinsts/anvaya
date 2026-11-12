import { describe, expect, it } from 'vitest';
import { averageAccessTime, cacheExample, traceCache } from './example';

describe('a cold direct-mapped cache', () => {
  it('distinguishes byte offsets, blocks and conflicting slots', () => {
    expect(traceCache([15, 16, 17, 0, 32, 0], 16, 2)).toEqual([
      { address: 15, block: 0, slot: 0, result: 'miss' },
      { address: 16, block: 1, slot: 1, result: 'miss' },
      { address: 17, block: 1, slot: 1, result: 'hit' },
      { address: 0, block: 0, slot: 0, result: 'hit' },
      { address: 32, block: 2, slot: 0, result: 'miss' },
      { address: 0, block: 0, slot: 0, result: 'miss' },
    ]);
  });

  it('starts cold on each independent trace and accepts empty input', () => {
    expect(traceCache([], 16, 2)).toEqual([]);
    expect(traceCache([0, 0], 16, 1).map((row) => row.result)).toEqual([
      'miss',
      'hit',
    ]);
    expect(traceCache([0], 16, 1)[0]?.result).toBe('miss');
  });

  it('rejects invalid geometry and addresses', () => {
    for (const value of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => traceCache([], value, 2)).toThrow(RangeError);
      expect(() => traceCache([], 16, value)).toThrow(RangeError);
    }
    for (const address of [-1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => traceCache([address], 16, 2)).toThrow(RangeError);
    }
  });

  it('uses an additional penalty and handles all-hit and all-miss extremes', () => {
    expect(averageAccessTime(2, 0, 50)).toBe(2);
    expect(averageAccessTime(2, 1, 50)).toBe(52);
    expect(averageAccessTime(0, 0.5, 0)).toBe(0);
    for (const rate of [-0.1, 1.1, NaN]) {
      expect(() => averageAccessTime(1, rate, 50)).toThrow(RangeError);
    }
    expect(() => averageAccessTime(-1, 0.1, 50)).toThrow(RangeError);
    expect(() => averageAccessTime(1, 0.1, Infinity)).toThrow(RangeError);
  });

  it('checks the exact output displayed by the lesson', () => {
    expect(cacheExample()).toBe(
      'miss hit hit hit miss miss\naverage model time: 6 ns',
    );
  });
});
