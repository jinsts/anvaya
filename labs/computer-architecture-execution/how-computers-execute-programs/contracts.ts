import { expect, it } from 'vitest';
// solve(initial) counts the instructions executed by set initial, add 255,
// branch back to the add while the accumulator is nonzero, halt, including
// the untaken branch and the halt. The initial value is an unsigned byte; an
// integer outside 0–255 or a non-integer is refused with a RangeError.
export function contracts(solve: (initial: number) => number) {
  it('unseen case 1', () => expect(solve(3)).toEqual(8));
  it('unseen case 2', () => expect(solve(7)).toEqual(16));
  it('unseen case 3', () => expect(solve(19)).toEqual(40));
  it('unseen case 4', () => expect(solve(0)).toEqual(514));
  it('unseen case 5', () => expect(solve(1)).toEqual(4));
  it('unseen case 6', () => expect(solve(255)).toEqual(512));
  it('unseen case 7', () => expect(() => solve(256)).toThrow(RangeError));
  it('unseen case 8', () => {
    expect(() => solve(-1)).toThrow(RangeError);
    expect(() => solve(2.5)).toThrow(RangeError);
  });
}
