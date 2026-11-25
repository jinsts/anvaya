import { expect, it } from 'vitest';
// solve(raw) reads an 8-bit pattern, given as its unsigned value, as a two's
// complement integer. A value that is not a whole number from 0 through 255 is
// not a byte pattern and is refused with a RangeError.
export function contracts(solve: (raw: number) => number) {
  it('unseen case 1', () => expect(solve(0)).toEqual(0));
  it('unseen case 2', () => expect(solve(128)).toEqual(-128));
  it('unseen case 3', () => expect(solve(173)).toEqual(-83));
  it('unseen case 4', () => expect(solve(250)).toEqual(-6));
  it('unseen case 5', () => expect(solve(127)).toEqual(127));
  it('unseen case 6', () => expect(() => solve(256)).toThrow(RangeError));
  it('unseen case 7', () => {
    expect(() => solve(-1)).toThrow(RangeError);
    expect(() => solve(1.5)).toThrow(RangeError);
  });
}
