import { describe, expect, it } from 'vitest';
import {
  LESSON_LEVELS,
  LESSON_MEMORY_NS,
  accessTimeExample,
  accessTimeParts,
  averageAccessTime,
  shown,
  tlbReach,
  traceTlb,
  translatedAccessTime,
  twoPasses,
} from './accessTime';

describe('average access time', () => {
  it('adds the additional penalty of a miss to the lookup already paid', () => {
    expect(averageAccessTime([{ hitNs: 1, missRate: 0.1 }], 50)).toBe(6);
    // A quoted total miss time is not an additional penalty: 0.9 × 1 + 0.1 × 50.
    expect(0.9 * 1 + 0.1 * 50).toBeCloseTo(5.9, 12);
    expect(averageAccessTime([], 80)).toBe(80);
    expect(averageAccessTime([{ hitNs: 2, missRate: 0 }], 80)).toBe(2);
    expect(averageAccessTime([{ hitNs: 2, missRate: 1 }], 80)).toBe(82);
  });

  it('nests each level inside the miss term of the one above', () => {
    expect(averageAccessTime(LESSON_LEVELS, LESSON_MEMORY_NS)).toBeCloseTo(
      1 + 0.1 * (4 + 0.25 * 80),
      12,
    );
    expect(shown(averageAccessTime(LESSON_LEVELS, LESSON_MEMORY_NS))).toBe(3.4);
  });

  it('splits the average into parts weighted by each level’s global reach', () => {
    const parts = accessTimeParts(LESSON_LEVELS, LESSON_MEMORY_NS);
    expect(parts.map((p) => p.name)).toEqual(['L1', 'L2', 'memory']);
    expect(parts.map((p) => shown(p.reach))).toEqual([1, 0.1, 0.025]);
    expect(parts.map((p) => shown(p.ns))).toEqual([1, 0.4, 2]);
    // The parts always sum to the nested formula.
    for (const [levels, memory] of [
      [LESSON_LEVELS, LESSON_MEMORY_NS],
      [
        [
          { hitNs: 1, missRate: 0.3 },
          { hitNs: 5, missRate: 0.5 },
          { hitNs: 15, missRate: 0.2 },
        ],
        100,
      ],
      [[], 70],
    ] as const) {
      const sum = accessTimeParts(levels, memory).reduce((t, p) => t + p.ns, 0);
      expect(sum).toBeCloseTo(averageAccessTime(levels, memory), 12);
    }
  });

  it('adds translation in front of a physically indexed access', () => {
    expect(
      translatedAccessTime({ tlbNs: 0.5, tlbMissRate: 0.01, walkNs: 40 }, 3.4),
    ).toBeCloseTo(4.3, 12);
    expect(
      translatedAccessTime({ tlbNs: 0, tlbMissRate: 0, walkNs: 1000 }, 3),
    ).toBe(3);
  });

  it('refuses rates outside 0–1 and negative or non-finite times', () => {
    for (const missRate of [-0.1, 1.5, Number.NaN])
      expect(() => averageAccessTime([{ hitNs: 1, missRate }], 50)).toThrow(
        RangeError,
      );
    for (const hitNs of [-1, Infinity])
      expect(() => averageAccessTime([{ hitNs, missRate: 0 }], 50)).toThrow(
        RangeError,
      );
    expect(() => averageAccessTime([], -5)).toThrow(RangeError);
    expect(() => accessTimeParts([], Number.NaN)).toThrow(RangeError);
    expect(() =>
      translatedAccessTime({ tlbNs: 1, tlbMissRate: 2, walkNs: 1 }, 1),
    ).toThrow(RangeError);
    expect(() =>
      translatedAccessTime({ tlbNs: -1, tlbMissRate: 0, walkNs: 1 }, 1),
    ).toThrow(RangeError);
  });
});

describe('a fully associative LRU TLB', () => {
  it('hits on the second pass only when every page fits', () => {
    expect(traceTlb(twoPasses(3), 4)).toEqual([
      'miss',
      'miss',
      'miss',
      'hit',
      'hit',
      'hit',
    ]);
    expect(traceTlb(twoPasses(4), 4).slice(4)).toEqual(Array(4).fill('hit'));
    // One page more than the entries: LRU evicts each page just before reuse.
    expect(traceTlb(twoPasses(5), 4)).toEqual(Array(10).fill('miss'));
  });

  it('keeps a recently used page and evicts the least recently used one', () => {
    expect(traceTlb([0, 1, 0, 2, 0, 1], 2)).toEqual([
      'miss',
      'miss',
      'hit',
      'miss',
      'hit',
      'miss',
    ]);
    expect(traceTlb([], 4)).toEqual([]);
    expect(traceTlb([7, 7, 7], 1)).toEqual(['miss', 'hit', 'hit']);
  });

  it('computes reach and refuses invalid sizes and pages', () => {
    expect(tlbReach(4, 4096)).toBe(16 * 1024);
    expect(tlbReach(64, 4096)).toBe(256 * 1024);
    expect(tlbReach(64, 2 * 1024 * 1024)).toBe(128 * 1024 * 1024);
    for (const entries of [0, -1, 1.5, Number.NaN])
      expect(() => traceTlb([0], entries)).toThrow(RangeError);
    for (const page of [-1, 0.5, Number.NaN])
      expect(() => traceTlb([page], 4)).toThrow(RangeError);
    expect(() => tlbReach(0, 4096)).toThrow(RangeError);
    expect(() => tlbReach(64, 0.5)).toThrow(RangeError);
  });
});

it('checks the exact output displayed by the lesson', () => {
  expect(accessTimeExample()).toBe(
    'one level: 6 ns\n' +
      'two levels: 3.4 ns; 2.5% of loads reach memory\n' +
      'with translation: 4.3 ns\n' +
      '3 pages twice, 4-entry TLB: miss miss miss hit hit hit\n' +
      '5 pages twice, 4-entry TLB: miss miss miss miss miss miss miss miss miss miss',
  );
});
