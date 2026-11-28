import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ROUND_TRIP,
  estimate,
  pair,
  perSwitch,
  switchesExample,
  type Recorded,
} from './switches';

const dir = 'labs/operating-systems-runtime-internals/context-switches';
const { records } = JSON.parse(readFileSync(`${dir}/switch.json`, 'utf8')) as {
  records: Recorded[];
};

describe('estimating a context switch from ping-pong', () => {
  it('counts two switches per round trip', () => {
    expect(ROUND_TRIP.filter((s) => s.switches)).toHaveLength(2);
    expect(perSwitch({ pingPongNs: 2600, pipeNs: 800 })).toBe(900);
  });

  it('agrees with a hand computation on the first three recorded batches', () => {
    // The independent check: per switch = (ping-pong − pipe) / 2 by hand,
    // then the median of three is the middle value and p90 (rank 3) the
    // largest.
    const first = pair(records, 'processes').slice(0, 3);
    const byHand = first
      .map((b) => (b.pingPongNs - b.pipeNs) / 2)
      .sort((a, b) => a - b);
    expect(estimate(first)).toEqual({ median: byHand[1], p90: byHand[2] });
  });

  it('pairs each ping-pong batch with the pipe timing of the same batch', () => {
    const batches = pair(records, 'threads');
    expect(batches).toHaveLength(15);
    for (const [i, b] of batches.entries()) {
      const pipe = records.find((r) => r.kind === 'pipe' && r.batch === i)!;
      expect(b.pipeNs).toBe(pipe.nsPerRoundTrip);
    }
    expect(() =>
      pair(
        records.filter((r) => r.kind !== 'pipe'),
        'threads',
      ),
    ).toThrow(RangeError);
  });

  it('matches the recording: one switch away from the measuring task per trip', () => {
    for (const r of records.filter((x) => x.kind !== 'pipe')) {
      // Every round trip took the measuring thread off the CPU once, and
      // /proc counted it as voluntary or involuntary.
      expect(r.voluntary + r.involuntary).toBeGreaterThanOrEqual(r.roundTrips);
      expect(r.voluntary + r.involuntary).toBeLessThan(r.roundTrips * 1.01);
      expect(r.involuntary).toBeGreaterThan(0);
    }
    // Every ping-pong batch was slower than its pipe work.
    for (const kind of ['processes', 'threads'] as const)
      expect(() => estimate(pair(records, kind))).not.toThrow();
  });

  it('prints the verified example', () => {
    expect(switchesExample()).toBe(
      'per switch: 900, 790, 1105, 845 ns\nmedian 872.5 ns, p90 1105 ns',
    );
  });
});
