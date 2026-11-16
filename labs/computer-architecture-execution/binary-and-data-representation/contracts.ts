import { expect, it } from 'vitest';
export function contracts(solve: (raw: number) => number) {
  it('unseen case 1', () => expect(solve(0)).toEqual(0));
  it('unseen case 2', () => expect(solve(128)).toEqual(-128));
  it('unseen case 3', () => expect(solve(173)).toEqual(-83));
  it('unseen case 4', () => expect(solve(250)).toEqual(-6));
}
