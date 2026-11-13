import { expect, it } from 'vitest';
export function contracts(solve: (addresses: readonly number[]) => string[]) {
  it('unseen case 1', () =>
    expect(solve([16, 20, 48, 16])).toEqual(['miss', 'hit', 'miss', 'miss']));
  it('unseen case 2', () =>
    expect(solve([0, 16, 0, 16])).toEqual(['miss', 'miss', 'hit', 'hit']));
}
