import { expect, it } from 'vitest';
// solve(pc, event) returns the user instruction index that runs after the
// kernel handles event, which happened with pc as the current index: a system
// call at pc, a restartable fault at pc, or an interrupt that arrived when pc
// was the next instruction to run. Indices are nonnegative safe integers;
// throw a RangeError for any other pc or for a resume index that is not one.
export function contracts(
  solve: (pc: number, event: 'syscall' | 'fault' | 'interrupt') => number,
) {
  it('unseen case 1', () => expect(solve(12, 'syscall')).toBe(13));
  it('unseen case 2', () => expect(solve(12, 'fault')).toBe(12));
  it('unseen case 3', () => expect(solve(12, 'interrupt')).toBe(12));
  it('unseen case 4', () => expect(solve(0, 'syscall')).toBe(1));
  it('unseen case 5', () => expect(solve(0, 'fault')).toBe(0));
  it('unseen case 6', () =>
    expect(() => solve(-1, 'interrupt')).toThrow(RangeError));
  it('unseen case 7', () =>
    expect(() => solve(2.5, 'fault')).toThrow(RangeError));
  it('unseen case 8', () =>
    expect(() => solve(Number.MAX_SAFE_INTEGER, 'syscall')).toThrow(
      RangeError,
    ));
}
