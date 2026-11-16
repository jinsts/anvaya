import { expect, it } from 'vitest';
// solve(codePoint) returns the UTF-8 bytes of one code point, built from
// RFC 3629's templates with shifts and masks, without TextEncoder. It throws a
// RangeError for surrogates and values above U+10FFFF.
export function contracts(solve: (codePoint: number) => number[]) {
  it('unseen case 1', () => expect(solve(0x24)).toEqual([0x24]));
  it('unseen case 2', () => expect(solve(0xa3)).toEqual([0xc2, 0xa3]));
  it('unseen case 3', () => expect(solve(0x7ff)).toEqual([0xdf, 0xbf]));
  it('unseen case 4', () => expect(solve(0x0939)).toEqual([0xe0, 0xa4, 0xb9]));
  it('unseen case 5', () => expect(solve(0xffff)).toEqual([0xef, 0xbf, 0xbf]));
  it('unseen case 6', () =>
    expect(solve(0x10348)).toEqual([0xf0, 0x90, 0x8d, 0x88]));
  it('unseen case 7', () => expect(() => solve(0xdfff)).toThrow(RangeError));
  it('unseen case 8', () => expect(() => solve(0x110000)).toThrow(RangeError));
}
