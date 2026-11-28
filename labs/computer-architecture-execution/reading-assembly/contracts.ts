import { expect, it } from 'vitest';
import type { Jump } from './x86';
// solve(jump, left, right): after `cmpl right, left`, AT&T order, the flags
// describe left − right in 32 bits. Return whether the conditional jump jumps.
// left and right are 32-bit patterns written as signed integers. Compute ZF,
// SF, CF and OF from the subtraction yourself; do not compare the numbers
// directly. An unknown jump, or an operand that is not an integer from -2^31
// to 2^31 - 1, is refused with a RangeError.
export function contracts(
  solve: (jump: Jump, left: number, right: number) => boolean,
) {
  it('unseen case 1', () => expect(solve('jl', -(2 ** 31), 1)).toBe(true));
  it('unseen case 2', () => expect(solve('jg', 2 ** 31 - 1, -1)).toBe(true));
  it('unseen case 3', () => expect(solve('ja', 2 ** 31 - 1, -1)).toBe(false));
  it('unseen case 4', () => expect(solve('jb', 1, -1)).toBe(true));
  it('unseen case 5', () => expect(solve('jle', 7, 7)).toBe(true));
  it('unseen case 6', () => expect(solve('jne', 0, 0)).toBe(false));
  it('unseen case 7', () => expect(solve('jae', 0, 0)).toBe(true));
  it('unseen case 8', () => expect(solve('jg', -5, -6)).toBe(true));
  it('unseen case 9', () =>
    expect(solve('jge', -(2 ** 31), 2 ** 31 - 1)).toBe(false));
  it('unseen case 10', () =>
    expect(() => solve('jz' as Jump, 0, 0)).toThrow(RangeError));
  it('unseen case 11', () =>
    expect(() => solve('jl', 2 ** 31, 0)).toThrow(RangeError));
}
