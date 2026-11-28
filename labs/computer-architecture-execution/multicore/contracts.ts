import { expect, it } from 'vitest';
// solve(accesses) runs MESI for one cache line and two cores, A and B, which
// both start Invalid. accesses is a string such as 'Ar Bw': each access is a
// core letter and r (read) or w (write). Return both cores' states after each
// access as two letters, A's first, for example ['EI', 'SS']. Any other token,
// such as a third core or an unknown operation, is refused with a RangeError.
export function contracts(solve: (accesses: string) => string[]) {
  it('unseen case 1', () => expect(solve('')).toEqual([]));
  it('unseen case 2', () => expect(solve('Ar')).toEqual(['EI']));
  it('unseen case 3', () => expect(solve('Ar Aw')).toEqual(['EI', 'MI']));
  it('unseen case 4', () => expect(solve('Bw')).toEqual(['IM']));
  it('unseen case 5', () =>
    expect(solve('Ar Br Bw Ar')).toEqual(['EI', 'SS', 'IM', 'SS']));
  it('unseen case 6', () =>
    expect(solve('Aw Bw Aw')).toEqual(['MI', 'IM', 'MI']));
  it('unseen case 7', () =>
    expect(solve('Aw Br Ar Ar')).toEqual(['MI', 'SS', 'SS', 'SS']));
  it('unseen case 8', () => expect(() => solve('Ar Cr')).toThrow(RangeError));
  it('unseen case 9', () => expect(() => solve('Ax')).toThrow(RangeError));
}
