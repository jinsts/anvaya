import { expect, it } from 'vitest';
import type { Batch, Estimate } from './switches';
// solve(batches) estimates the cost of one context switch from ping-pong
// batches. Each batch's estimate is (pingPongNs − pipeNs) / 2: a round trip
// makes two switches on top of the pipe work. Return the median and p90 of
// the estimates: the median of an even count is the mean of the two middle
// values, and p90 is the value at 1-based rank ceil(0.9 × n) in sorted order.
// Do not change the input. Throw a RangeError for no batches, a timing that is
// not a finite number, a pipe time that is not positive, or a ping-pong time
// that is not greater than its pipe time.
const b = (pingPongNs: number, pipeNs: number): Batch => ({
  pingPongNs,
  pipeNs,
});

export function contracts(solve: (batches: Batch[]) => Estimate) {
  it('unseen case 1: one batch', () =>
    expect(solve([b(2600, 800)])).toEqual({ median: 900, p90: 900 }));
  it('unseen case 2: two batches', () =>
    expect(solve([b(3000, 800), b(2600, 800)])).toEqual({
      median: 1000,
      p90: 1100,
    }));
  it('unseen case 3: pipe times differ by batch', () =>
    expect(solve([b(2000, 1000), b(2400, 600), b(2200, 1200)])).toEqual({
      median: 500,
      p90: 900,
    }));
  it('unseen case 4: ten batches with one slow outlier', () =>
    expect(
      solve([
        b(1200, 1000),
        b(1400, 1000),
        b(1600, 1000),
        b(1800, 1000),
        b(2000, 1000),
        b(2200, 1000),
        b(2400, 1000),
        b(2600, 1000),
        b(2800, 1000),
        b(9000, 1000),
      ]),
    ).toEqual({ median: 550, p90: 900 }));
  it('unseen case 5: the input stays as it was', () => {
    const batches = [b(3000, 1000), b(1500, 1000)];
    solve(batches);
    expect(batches).toEqual([b(3000, 1000), b(1500, 1000)]);
  });
  it('unseen case 6: no batches', () =>
    expect(() => solve([])).toThrow(RangeError));
  it('unseen case 7: ping-pong no slower than the pipe work', () =>
    expect(() => solve([b(2600, 800), b(800, 800)])).toThrow(RangeError));
  it('unseen case 8: a timing that is not a number', () =>
    expect(() => solve([b(Number.NaN, 800)])).toThrow(RangeError));
  it('unseen case 9: a zero pipe time', () =>
    expect(() => solve([b(2600, 0)])).toThrow(RangeError));
}
