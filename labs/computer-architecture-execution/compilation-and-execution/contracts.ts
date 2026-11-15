import { expect, it } from 'vitest';
// solve(symbol, addend, place) returns the four little-endian bytes of the
// signed 32-bit value S + A − P, and throws a RangeError when it does not fit.
export function contracts(
  solve: (symbol: number, addend: number, place: number) => number[],
) {
  it('unseen case 1', () =>
    expect(solve(0x2100, -4, 0x2001)).toEqual([0xfb, 0, 0, 0]));
  it('unseen case 2', () =>
    expect(solve(0x1000, -4, 0x1101)).toEqual([0xfb, 0xfe, 0xff, 0xff]));
  it('unseen case 3', () =>
    expect(solve(0x401000, 0, 0x401000)).toEqual([0, 0, 0, 0]));
  it('unseen case 4', () =>
    expect(solve(0x12345678, -4, 0x10)).toEqual([0x64, 0x56, 0x34, 0x12]));
  it('unseen case 5', () =>
    expect(() => solve(0x100000000, -4, 0)).toThrow(RangeError));
}
