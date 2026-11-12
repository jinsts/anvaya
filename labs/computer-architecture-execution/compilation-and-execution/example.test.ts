import { describe, expect, it } from 'vitest';
import { link, linkingExample, type ObjectModule } from './example';

describe('illustrative symbol resolution and relocation', () => {
  it('checks every displayed relocated word and symbol address', () => {
    expect(linkingExample()).toBe(
      'image: [102, 99, 7]\nentry: 100\nhelper: 102',
    );
  });

  it('resolves a backward reference and does not mutate the object', () => {
    const module: ObjectModule = {
      words: [7, 0],
      definitions: { self: 0 },
      references: [{ at: 1, symbol: 'self' }],
    };
    expect(link([module], 50).image).toEqual([7, 50]);
    expect(module.words).toEqual([7, 0]);
    expect(link([module], 80).image).toEqual([7, 80]);
  });

  it('supports an empty image and zero-valued symbol addresses', () => {
    expect(link([]).image).toEqual([]);
    expect(
      link([
        {
          words: [9],
          definitions: { zero: 0 },
          references: [{ at: 0, symbol: 'zero' }],
        },
      ]).image,
    ).toEqual([0]);
  });

  it('diagnoses unresolved and duplicate symbols', () => {
    const module: ObjectModule = {
      words: [0],
      definitions: { entry: 0 },
      references: [{ at: 0, symbol: 'missing' }],
    };
    expect(() => link([module])).toThrow('Undefined symbol: missing');
    expect(() => link([module, module])).toThrow('Duplicate symbol: entry');
  });

  it('rejects invalid offsets, words, addresses and overlapping relocations', () => {
    expect(() =>
      link([{ words: [0], definitions: { bad: 1 }, references: [] }]),
    ).toThrow('definition');
    expect(() =>
      link([
        { words: [0], definitions: {}, references: [{ at: -1, symbol: 'x' }] },
      ]),
    ).toThrow('relocation');
    expect(() =>
      link([{ words: [NaN], definitions: {}, references: [] }]),
    ).toThrow('Words');
    expect(() => link([], -1)).toThrow('loadBase');
    expect(() =>
      link(
        [{ words: [1], definitions: {}, references: [] }],
        Number.MAX_SAFE_INTEGER,
      ),
    ).toThrow('safe integer');
    expect(() =>
      link([
        {
          words: [0],
          definitions: { x: 0 },
          references: [
            { at: 0, symbol: 'x' },
            { at: 0, symbol: 'x' },
          ],
        },
      ]),
    ).toThrow('Duplicate relocation');
  });
});
