import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  KERNELS,
  ipc,
  measuringExample,
  percentile,
  ridgePoint,
  roofline,
  shareFaster,
  summarize,
} from './stats';

const dir = 'labs/computer-architecture-execution/measuring-performance';

describe('timing summaries', () => {
  it('uses nearest-rank percentiles and the middle mean', () => {
    expect(summarize([4, 1, 3, 2])).toEqual({
      n: 4,
      min: 1,
      p10: 1,
      median: 2.5,
      p90: 4,
      max: 4,
    });
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
    expect(() => summarize([])).toThrow(RangeError);
    expect(() => percentile([1], 0)).toThrow(RangeError);
  });

  it('counts ties as half a win', () => {
    expect(shareFaster([1, 2, 3], [2, 3, 4])).toBeCloseTo(7 / 9, 12);
    expect(shareFaster([1], [1])).toBe(0.5);
  });

  it('reads the recorded warm and cold runs', () => {
    const data = JSON.parse(readFileSync(`${dir}/timing.json`, 'utf8')) as {
      records: { state: string; nsPerElement: number }[];
    };
    const ns = (state: string) =>
      data.records.filter((r) => r.state === state).map((r) => r.nsPerElement);
    const warm = ns('warm');
    const cold = ns('cold');
    expect(warm).toHaveLength(30);
    expect(cold).toHaveLength(30);
    // What the lesson states about this run: the medians differ, the ranges
    // overlap, and a single pairing can pick the wrong winner.
    expect(summarize(warm).median).toBeLessThan(summarize(cold).median);
    expect(Math.min(...cold)).toBeLessThan(Math.max(...warm));
    for (const runs of [warm, cold])
      expect(Math.max(...runs) / Math.min(...runs)).toBeGreaterThan(1.5);
    // The prediction's answer: the cold penalty (the gap between medians) is
    // smaller than the run-to-run spread within either series.
    const penalty = summarize(cold).median - summarize(warm).median;
    for (const runs of [warm, cold])
      expect(penalty).toBeLessThan(Math.max(...runs) - Math.min(...runs));
    const share = shareFaster(warm, cold);
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(1);
  });
});

describe('roofline and counters', () => {
  it('takes the lower of the two roofs', () => {
    expect(ridgePoint(100, 50)).toBe(2);
    expect(roofline(100, 50, 1)).toBe(50);
    expect(roofline(100, 50, 4)).toBe(100);
    const bounds = KERNELS.map((k) => roofline(100, 50, k.flopsPerByte));
    expect(bounds[0]).toBeCloseTo(50 / 12, 12);
    expect(bounds.slice(1)).toEqual([12.5, 100]);
    expect(() => roofline(100, 0, 1)).toThrow(RangeError);
  });

  it('answers the lesson exercise', () => {
    // 200 GFLOP/s and 25 GB/s meet at 8 flops per byte; a kernel at 1/4 is
    // held to 6.25 GFLOP/s by memory bandwidth.
    expect(ridgePoint(200, 25)).toBe(8);
    expect(roofline(200, 25, 0.25)).toBe(6.25);
  });

  it('computes instructions per cycle', () => {
    expect(ipc(4_000_000_000, 2_500_000_000)).toBe(1.6);
    expect(() => ipc(1, 0)).toThrow(RangeError);
    expect(() => ipc(1.5, 1)).toThrow(RangeError);
  });

  it('prints the lesson output', () => {
    expect(measuringExample()).toBe(
      [
        'median 0.24, p90 0.31, min 0.21, max 0.4',
        'A faster than B in 77.8% of pairings',
        'illustrative roof at 100 GFLOP/s and 50 GB/s: ridge 2 flops/byte',
        'Array add: 0.083 flops/byte, bound 4.2 GFLOP/s',
        'Dot product: 0.250 flops/byte, bound 12.5 GFLOP/s',
        'Matrix multiply: 170.667 flops/byte, bound 100.0 GFLOP/s',
        'illustrative counters: 4,000,000,000 instructions in 2,500,000,000 cycles = IPC 1.6',
      ].join('\n'),
    );
  });
});

it('the owner-run perf script stops cleanly without perf', () => {
  let status = 0;
  let stderr = '';
  try {
    // An empty search path: the script must stop before using any command.
    execFileSync('/bin/bash', [`${dir}/perf-counters.sh`], {
      env: { PATH: '/nonexistent' },
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const e = error as { status: number; stderr: string };
    status = e.status;
    stderr = e.stderr;
  }
  expect(status).toBe(2);
  expect(stderr).toContain('perf is not installed');
});
