import { expect, it } from 'vitest';
// solve(bits) returns the number a binary32 pattern stores. Build it from the
// sign, exponent and fraction fields with arithmetic, without DataView or
// typed arrays.
export function contracts(solve: (bits: number) => number) {
  const check = (bits: number, expected: number) =>
    expect(Object.is(solve(bits), expected)).toBe(true);
  it('unseen case 1', () => check(0x3f800000, 1));
  it('unseen case 2', () => check(0xc0a80000, -5.25));
  it('unseen case 3', () => check(0x3e800000, 0.25));
  it('unseen case 4', () => check(0x00800000, 2 ** -126));
  it('unseen case 5', () => check(0x00400000, 2 ** -127));
  it('unseen case 6', () => check(0x7f7fffff, (2 - 2 ** -23) * 2 ** 127));
  it('unseen case 7', () => check(0x80000000, -0));
  it('unseen case 8', () => check(0xff800000, -Infinity));
  it('unseen case 9', () => check(0x7fc00001, NaN));
}
