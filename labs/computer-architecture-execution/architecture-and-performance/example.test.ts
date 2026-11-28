import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { amdahl, amdahlTimes, cpuSeconds, performanceExample } from './example';

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

  it('splits normalized time into the parts the Amdahl bars draw', () => {
    expect(amdahlTimes(0.25, 4)).toEqual({
      serial: 0.25,
      improvable: 0.75,
      improved: 0.1875,
      total: 0.4375,
      speedup: amdahl(0.25, 4),
    });
    expect(amdahlTimes(0.25, 4).speedup.toFixed(3)).toBe('2.286');
    for (const [serial, speedup] of [
      [0, 8],
      [0.5, 2],
      [1, 3],
      [0.3, 0.5],
    ] as const) {
      const times = amdahlTimes(serial, speedup);
      // The new total is the time whose reciprocal amdahl() reports.
      expect(times.total * times.speedup).toBeCloseTo(1, 12);
      expect(times.serial + times.improvable).toBeCloseTo(1, 12);
    }
    expect(() => amdahlTimes(1.5, 2)).toThrow(RangeError);
    expect(() => amdahlTimes(0.5, 0)).toThrow(RangeError);
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

it('records every column-order sum slower than every row-order sum', () => {
  const data = JSON.parse(
    readFileSync(
      'labs/computer-architecture-execution/architecture-and-performance/measurement.json',
      'utf8',
    ),
  ) as { size: number; records: { order: string; seconds: number }[] };
  const times = (order: string) =>
    data.records.filter((r) => r.order === order).map((r) => r.seconds);
  expect(times('rows')).toHaveLength(6);
  expect(Math.min(...times('columns'))).toBeGreaterThan(
    Math.max(...times('rows')),
  );
  // 2048 × 2048 four-byte values: 16 MiB.
  expect((data.size * data.size * 4) / 2 ** 20).toBe(16);
});
