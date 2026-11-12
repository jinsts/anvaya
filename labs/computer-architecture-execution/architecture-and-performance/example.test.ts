import { describe, expect, it } from 'vitest';
import { amdahl, cpuSeconds, performanceExample } from './example';

describe('fixed-work performance estimates', () => {
  it('checks the displayed output exactly', () => {
    expect(performanceExample()).toBe(
      'baseline: 1.000 s\ncandidate: 0.900 s\nspeedup: 1.111x\n25% serial, 4x parallel: 2.286x',
    );
  });

  it('allows zero work and CPI below one', () => {
    expect(cpuSeconds(0, 0.5, 1_000)).toBe(0);
    expect(cpuSeconds(1_000, 0.5, 1_000)).toBe(0.5);
  });

  it('scales time with work and inversely with frequency under fixed CPI', () => {
    expect(cpuSeconds(200, 2, 100)).toBe(4);
    expect(cpuSeconds(100, 2, 200)).toBe(1);
  });

  it('checks serial and parallel limits, unchanged work, and slowdown', () => {
    expect(amdahl(1, 8)).toBe(1);
    expect(amdahl(0, 8)).toBe(8);
    expect(amdahl(0.3, 1)).toBe(1);
    expect(amdahl(0.5, 0.5)).toBeCloseTo(2 / 3);
    expect(amdahl(0.25, 1000)).toBeLessThan(4);
  });

  it.each([-1, 0.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects instruction count %s',
    (count) => expect(() => cpuSeconds(count, 1, 1)).toThrow(RangeError),
  );

  it.each([0, -1, Number.NaN, Infinity])(
    'rejects invalid CPI or frequency %s',
    (value) => {
      expect(() => cpuSeconds(1, value, 1)).toThrow(RangeError);
      expect(() => cpuSeconds(1, 1, value)).toThrow(RangeError);
      expect(() => amdahl(0.5, value)).toThrow(RangeError);
    },
  );

  it.each([-0.1, 1.1, Number.NaN, Infinity])(
    'rejects serial fraction %s',
    (value) => {
      expect(() => amdahl(value, 2)).toThrow(RangeError);
    },
  );

  it('rejects an overflowing estimate', () => {
    expect(() => cpuSeconds(2, Number.MAX_VALUE, 1)).toThrow(RangeError);
  });
});
