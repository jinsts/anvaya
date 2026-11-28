import { expect, it } from 'vitest';
// solve(values) returns the binary32 sum that GCC's reassociated four-lane
// loop computes: lane k accumulates elements k, k + 4, k + 8 …, the lanes
// combine as (lane 0 + lane 2) + (lane 1 + lane 3), and elements past the
// last multiple of four are added afterwards in order. Round every addition
// to binary32 (Math.fround). A value that is not a number, or a finite number
// too large for binary32, is refused with a RangeError.
export function contracts(solve: (values: number[]) => number) {
  it('unseen case 1', () => expect(solve([])).toBe(0));
  it('unseen case 2', () => expect(solve([1, 2, 3])).toBe(6));
  it('unseen case 3', () =>
    expect(solve([2 ** 24, 1, 1, 1])).toBe(2 ** 24 + 2));
  it('unseen case 4', () =>
    expect(solve([1, 1, 1, 1, 2 ** 24, 0, 0, 0])).toBe(2 ** 24 + 2));
  it('unseen case 5', () =>
    expect(solve([2 ** 24, 1, 1, 1, 1, 1, 1, 1, 1])).toBe(2 ** 24 + 8));
  it('unseen case 6', () =>
    expect(solve([0.1, 0.2, 0.3, 0.4])).toBe(
      Math.fround(
        Math.fround(Math.fround(0.1) + Math.fround(0.3)) +
          Math.fround(Math.fround(0.2) + Math.fround(0.4)),
      ),
    ));
  it('unseen case 7', () => expect(() => solve([1, 1e39])).toThrow(RangeError));
  it('unseen case 8', () =>
    expect(() => solve([1, '2' as unknown as number])).toThrow(RangeError));
}
