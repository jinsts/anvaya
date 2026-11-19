import { describe, expect, it } from 'vitest';
import { total, totalExample } from './example';

// TODO: Test every claim the lesson makes about the model: each transition,
// boundary and refusal, and the exact output the lesson displays.
describe('total', () => {
  it('adds values and refuses non-finite ones', () => {
    expect(total([1, 2, 3])).toBe(6);
    expect(() => total([Number.POSITIVE_INFINITY])).toThrow(RangeError);
  });

  it('prints the lesson output', () => {
    expect(totalExample()).toBe('total([1,2,3]) = 6\ntotal([]) = 0');
  });
});
