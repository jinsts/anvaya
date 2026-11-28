import { expect, it } from 'vitest';
// solve(outcomes) returns how many of a branch's outcomes a two-bit
// saturating counter mispredicts, starting in state 1 (weakly not taken):
// predict taken in states 2 and 3, step toward each outcome, stop at 0 and 3.
// An outcome that is not a boolean is refused with a RangeError.
export function contracts(solve: (outcomes: boolean[]) => number) {
  const T = true;
  const N = false;
  it('unseen case 1', () => expect(solve([])).toBe(0));
  it('unseen case 2', () => expect(solve([T, T, T, T])).toBe(1));
  it('unseen case 3', () => expect(solve([N, N, N, T, N])).toBe(1));
  it('unseen case 4', () => expect(solve([T, T, T, N, T, T, T, N, T])).toBe(3));
  it('unseen case 5', () => expect(solve([T, N, T, N, T, N])).toBe(6));
  it('unseen case 6', () => expect(solve([T, T, N, N, N, T, T])).toBe(5));
  it('unseen case 7', () =>
    expect(() => solve([T, 1 as unknown as boolean])).toThrow(RangeError));
  it('unseen case 8', () =>
    expect(() => solve(['N' as unknown as boolean])).toThrow(RangeError));
}
