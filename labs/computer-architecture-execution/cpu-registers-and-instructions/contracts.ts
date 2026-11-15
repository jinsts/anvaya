import { expect, it } from 'vitest';
import type { EncodedOperation } from './example';
// solve(word) splits a 16-bit teaching instruction into its 4-bit opcode,
// 4-bit register and 8-bit immediate. Opcodes other than 1 and 2 are reserved,
// and words outside 0–0xffff are invalid: both throw a RangeError.
export function contracts(solve: (word: number) => EncodedOperation) {
  it('unseen case 1', () =>
    expect(solve(0x1000)).toEqual({ opcode: 1, register: 0, immediate: 0 }));
  it('unseen case 2', () =>
    expect(solve(0x1fff)).toEqual({ opcode: 1, register: 15, immediate: 255 }));
  it('unseen case 3', () =>
    expect(solve(0x2a0b)).toEqual({ opcode: 2, register: 10, immediate: 11 }));
  it('unseen case 4', () => expect(() => solve(0x3000)).toThrow(RangeError));
  it('unseen case 5', () => expect(() => solve(0x0123)).toThrow(RangeError));
  it('unseen case 6', () => expect(() => solve(0x10000)).toThrow(RangeError));
}
