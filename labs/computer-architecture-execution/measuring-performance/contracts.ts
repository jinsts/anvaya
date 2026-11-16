import { expect, it } from 'vitest';
// solve(values) summarizes repeated timings as { median, p90 }. The median of
// an even count is the mean of the two middle values. p90 is the nearest-rank
// percentile: the value at 1-based rank ceil(0.9 × n) in sorted order. Do not
// change the input. Throw a RangeError for an empty list or a non-finite value.
export function contracts(
  solve: (values: number[]) => { median: number; p90: number },
) {
  it('unseen case 1', () => expect(solve([5])).toEqual({ median: 5, p90: 5 }));
  it('unseen case 2', () =>
    expect(solve([3, 1])).toEqual({ median: 2, p90: 3 }));
  it('unseen case 3', () =>
    expect(solve([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual({
      median: 5.5,
      p90: 9,
    }));
  it('unseen case 4', () =>
    expect(solve([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toEqual({
      median: 6,
      p90: 10,
    }));
  it('unseen case 5', () =>
    expect(solve([0.5, 0.25, 0.75, 0.25])).toEqual({
      median: 0.375,
      p90: 0.75,
    }));
  it('unseen case 6', () =>
    expect(solve([10, 1, 1, 1, 1])).toEqual({ median: 1, p90: 10 }));
  it('unseen case 7', () => {
    const input = [3, 1, 2];
    solve(input);
    expect(input).toEqual([3, 1, 2]);
  });
  it('unseen case 8', () => expect(() => solve([])).toThrow(RangeError));
  it('unseen case 9', () =>
    expect(() => solve([1, Number.NaN])).toThrow(RangeError));
}
