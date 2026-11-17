import { expect, it } from 'vitest';
// TODO: Describe the contract the learner implements: inputs, output, units,
// assumptions and refused inputs. The lesson and README state the same
// contract; neither reveals these expected values.
export function contracts(solve: (values: readonly number[]) => number) {
  // TODO: At least five cases: normal, boundary and invalid inputs. Keep the
  // names "unseen case N" so test output does not reveal the answers.
  it('unseen case 1', () => expect(solve([1, 2, 3])).toBe(6));
  it('unseen case 2', () => expect(solve([])).toBe(0));
  it('unseen case 3', () => expect(solve([-1, 1])).toBe(0));
  it('unseen case 4', () => expect(solve([0.5, 0.25])).toBe(0.75));
  // Refusals expect a specific error type or message, never a bare toThrow().
  it('unseen case 5', () =>
    expect(() => solve([Number.NaN])).toThrow(RangeError));
}
