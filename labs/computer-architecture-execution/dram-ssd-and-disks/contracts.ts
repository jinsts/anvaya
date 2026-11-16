import { expect, it } from 'vitest';
// solve(averageSeekMs, rpm, transferMBps, bytes) returns the expected time in
// milliseconds for one random read: average seek, plus half a revolution,
// plus bytes at the transfer rate (1 MB/s = 10^6 bytes per second). It throws
// a RangeError for a non-positive rpm or rate, or a negative seek or size.
export function contracts(
  solve: (
    averageSeekMs: number,
    rpm: number,
    transferMBps: number,
    bytes: number,
  ) => number,
) {
  it('unseen case 1', () =>
    expect(solve(5, 10000, 180, 8192)).toBeCloseTo(8.045511, 5));
  it('unseen case 2', () =>
    expect(solve(12, 5400, 90, 4096)).toBeCloseTo(17.601067, 5));
  it('unseen case 3', () => expect(solve(0, 15000, 250, 0)).toBeCloseTo(2, 9));
  it('unseen case 4', () =>
    expect(solve(8, 7200, 150, 1 << 20)).toBeCloseTo(19.157173, 5));
  it('unseen case 5', () =>
    expect(() => solve(8, 0, 150, 4096)).toThrow(RangeError));
  it('unseen case 6', () =>
    expect(() => solve(-1, 7200, 150, 4096)).toThrow(RangeError));
}
