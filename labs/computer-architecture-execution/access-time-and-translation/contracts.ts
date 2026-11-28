import { expect, it } from 'vitest';
// solve(levels, memoryNs) returns the average time of one access in
// nanoseconds. Levels are listed nearest the core first, each as { hitNs,
// missRate }: every access that reaches a level pays its hitNs, and missRate is
// the fraction of those accesses that miss it and go on to the next level.
// Memory answers every access that misses the last level. A miss rate outside
// 0–1, or a negative or non-finite time, is refused with a RangeError.
type Level = { hitNs: number; missRate: number };
export function contracts(
  solve: (levels: readonly Level[], memoryNs: number) => number,
) {
  it('unseen case 1', () =>
    expect(solve([{ hitNs: 2, missRate: 0.05 }], 60)).toBeCloseTo(5, 10));
  it('unseen case 2', () =>
    expect(
      solve(
        [
          { hitNs: 1, missRate: 0.2 },
          { hitNs: 6, missRate: 0.5 },
          { hitNs: 20, missRate: 0.25 },
        ],
        120,
      ),
    ).toBeCloseTo(7.2, 10));
  it('unseen case 3', () => expect(solve([], 80)).toBeCloseTo(80, 10));
  it('unseen case 4', () =>
    expect(
      solve(
        [
          { hitNs: 1, missRate: 0 },
          { hitNs: 4, missRate: 0.5 },
        ],
        100,
      ),
    ).toBeCloseTo(1, 10));
  it('unseen case 5', () =>
    expect(
      solve(
        [
          { hitNs: 1, missRate: 1 },
          { hitNs: 4, missRate: 0 },
        ],
        100,
      ),
    ).toBeCloseTo(5, 10));
  it('unseen case 6', () =>
    expect(() => solve([{ hitNs: 1, missRate: 1.5 }], 100)).toThrow(
      RangeError,
    ));
  it('unseen case 7', () => {
    expect(() => solve([{ hitNs: -1, missRate: 0.1 }], 100)).toThrow(
      RangeError,
    );
    expect(() => solve([], Number.NaN)).toThrow(RangeError);
  });
}
