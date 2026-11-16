import { expect, it } from 'vitest';
// solve(baseline, candidate) returns how many times faster the candidate is
// (baseline CPU time ÷ candidate CPU time) when each run is described by its
// instruction count, average cycles per instruction and clock frequency in Hz.
// Throw a RangeError for a negative or fractional instruction count, or for a
// CPI or frequency that is not positive and finite.
type Run = { instructions: number; cpi: number; hz: number };
export function contracts(solve: (baseline: Run, candidate: Run) => number) {
  const run = (instructions: number, cpi: number, hz = 1e9): Run => ({
    instructions,
    cpi,
    hz,
  });
  it('unseen case 1', () =>
    expect(solve(run(1000, 1), run(1000, 1))).toBeCloseTo(1, 12));
  it('unseen case 2', () =>
    expect(solve(run(1000, 1), run(500, 3))).toBeCloseTo(2 / 3, 12));
  it('unseen case 3', () =>
    expect(solve(run(2e9, 1.5, 3e9), run(1.5e9, 1.8, 3e9))).toBeCloseTo(
      10 / 9,
      12,
    ));
  it('unseen case 4', () =>
    expect(solve(run(1e9, 2, 2e9), run(1e9, 2, 4e9))).toBeCloseTo(2, 12));
  it('unseen case 5', () =>
    expect(solve(run(1e9, 1), run(1e9, 0.5))).toBeCloseTo(2, 12));
  it('unseen case 6', () =>
    expect(() => solve(run(-1, 1), run(1, 1))).toThrow(RangeError));
  it('unseen case 7', () =>
    expect(() => solve(run(10, 0), run(10, 1))).toThrow(RangeError));
  it('unseen case 8', () =>
    expect(() => solve(run(10, 1), run(10, 1, Infinity))).toThrow(RangeError));
  it('unseen case 9', () =>
    expect(() => solve(run(10.5, 1), run(10, 1))).toThrow(RangeError));
}
