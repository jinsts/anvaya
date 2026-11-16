import { expect, it } from 'vitest';
// Reads only, 16-byte lines, a cold cache and exact LRU replacement.
export function contracts(
  solve: (addresses: readonly number[], sets: number, ways: number) => string[],
) {
  it('unseen case 1', () =>
    expect(solve([0, 64, 0, 64, 128, 0], 2, 2)).toEqual([
      'miss',
      'miss',
      'hit',
      'hit',
      'miss',
      'miss',
    ]));
  it('unseen case 2', () =>
    expect(solve([0, 16, 32, 48, 0, 16], 4, 1)).toEqual([
      'miss',
      'miss',
      'miss',
      'miss',
      'hit',
      'hit',
    ]));
  it('unseen case 3', () =>
    expect(solve([0, 64, 0, 128, 0], 1, 2)).toEqual([
      'miss',
      'miss',
      'hit',
      'miss',
      'hit',
    ]));
  it('unseen case 4', () =>
    expect(solve([0, 64, 128, 0, 64, 128], 1, 2)).toEqual(
      Array<string>(6).fill('miss'),
    ));
  it('unseen case 5', () => expect(solve([], 2, 2)).toEqual([]));
}
