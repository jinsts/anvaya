import { expect, it } from 'vitest';
// solve(readyTimes, interval) polls a device every `interval` time units,
// starting at time `interval`, until every completion has been found. A poll
// at time t finds every completion ready at or before t that is not yet found.
// Return { checks, emptyChecks, delays }: the polls made, the polls that found
// nothing new, and for each completion in input order the time it was found
// minus its ready time. With no completions, nothing is polled. Throw a
// RangeError for an interval that is not positive and finite, or a ready time
// that is negative or not finite.
type Result = { checks: number; emptyChecks: number; delays: number[] };
export function contracts(
  solve: (readyTimes: readonly number[], interval: number) => Result,
) {
  it('unseen case 1', () =>
    expect(solve([7], 3)).toEqual({ checks: 3, emptyChecks: 2, delays: [2] }));
  it('unseen case 2', () =>
    expect(solve([4, 5, 6], 2)).toEqual({
      checks: 3,
      emptyChecks: 1,
      delays: [0, 1, 0],
    }));
  it('unseen case 3', () =>
    expect(solve([], 5)).toEqual({ checks: 0, emptyChecks: 0, delays: [] }));
  it('unseen case 4', () =>
    expect(solve([0], 4)).toEqual({ checks: 1, emptyChecks: 0, delays: [4] }));
  it('unseen case 5', () =>
    expect(solve([12, 3], 3)).toEqual({
      checks: 4,
      emptyChecks: 2,
      delays: [0, 0],
    }));
  it('unseen case 6', () => expect(() => solve([1], 0)).toThrow(RangeError));
  it('unseen case 7', () => {
    expect(() => solve([-1], 2)).toThrow(RangeError);
    expect(() => solve([Number.NaN], 2)).toThrow(RangeError);
  });
}
