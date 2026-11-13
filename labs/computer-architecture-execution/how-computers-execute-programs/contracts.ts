import { expect, it } from 'vitest';
export function contracts(solve: (initial: number) => number) {
  it('unseen case 1', () => expect(solve(3)).toEqual(8));
  it('unseen case 2', () => expect(solve(7)).toEqual(16));
  it('unseen case 3', () => expect(solve(19)).toEqual(40));
  it('unseen case 4', () => expect(solve(0)).toEqual(514));
}
