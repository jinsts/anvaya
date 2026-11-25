import { expect, it } from 'vitest';
// A cold, direct-mapped cache with two 16-byte lines: one hit or miss per byte
// address, in order. An address that is not a nonnegative safe integer is
// refused with a RangeError.
export function contracts(solve: (addresses: readonly number[]) => string[]) {
  it('unseen case 1', () =>
    expect(solve([16, 20, 48, 16])).toEqual(['miss', 'hit', 'miss', 'miss']));
  it('unseen case 2', () =>
    expect(solve([0, 16, 0, 16])).toEqual(['miss', 'miss', 'hit', 'hit']));
  it('unseen case 3', () =>
    expect(solve([15, 16, 31, 32, 47])).toEqual([
      'miss',
      'miss',
      'hit',
      'miss',
      'hit',
    ]));
  it('unseen case 4', () => expect(solve([])).toEqual([]));
  it('unseen case 5', () =>
    expect(solve([16, 0, 32, 16, 0])).toEqual([
      'miss',
      'miss',
      'miss',
      'hit',
      'miss',
    ]));
  it('unseen case 6', () => expect(() => solve([0, -16])).toThrow(RangeError));
  it('unseen case 7', () => {
    expect(() => solve([0.5])).toThrow(RangeError);
    expect(() => solve([2 ** 53])).toThrow(RangeError);
  });
}
