import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXAMPLE,
  WEIGHTS,
  pairShare,
  runs,
  schedulingExample,
  simulate,
  solve,
  weightOf,
} from './fair';

const dir = 'labs/operating-systems-runtime-internals/scheduling';
const recorded = JSON.parse(readFileSync(`${dir}/fair.json`, 'utf8')) as {
  shares: { nice: number[]; cpuUs: number[] }[];
  wakes: { neighbour: boolean; lateNs: number }[];
};

describe('a weighted fair scheduler', () => {
  it('uses the kernel weight table, about 1.25 times per nice step', () => {
    expect(WEIGHTS).toHaveLength(40);
    expect(weightOf(0)).toBe(1024);
    expect(weightOf(-5)).toBe(3121);
    expect(weightOf(5)).toBe(335);
    for (let nice = -20; nice < 19; ++nice) {
      const ratio = weightOf(nice) / weightOf(nice + 1);
      expect(ratio).toBeGreaterThan(1.15);
      expect(ratio).toBeLessThan(1.35);
    }
  });

  it('matches a table computed by hand for nice 0 against nice 5', () => {
    // The independent check. Quantum 2 ms. B's vruntime grows by
    // 1024/335 = 3.0567 ms per millisecond it runs; A's by 1 ms.
    //   t=0  A 0     B 0     tie, A listed first   A runs 2 ms -> A 2
    //   t=2  A 2     B 0     B lowest              B runs 2 ms -> B 6.113
    //   t=4  A 2     B 6.113 A                     -> A 4
    //   t=6  A 4                                   -> A 6
    //   t=8  A 6     B 6.113 A, still lower        -> A 8
    //   t=10 A 8     B 6.113 B                     -> B 12.227
    //   t=12 A 8                                   A for the rest
    const { timeline, decisions } = simulate(
      [{ name: 'A' }, { name: 'B', nice: 5 }],
      2,
      16,
    );
    expect(timeline.join('')).toBe('AABBAAAAAABBAAAA');
    expect(decisions.map((d) => d.picked).join('')).toBe('ABAAABAA');
    expect(decisions[5]!.candidates).toEqual([
      { name: 'B', vruntime: 2 * 3056716 },
      { name: 'A', vruntime: 8_000_000 },
    ]);
  });

  it('gives a busy pair the shares Linux gave them on one CPU', () => {
    for (const { nice, cpuUs } of recorded.shares) {
      const share = cpuUs[1]! / (cpuUs[0]! + cpuUs[1]!);
      expect(Math.abs(share - pairShare(nice[0]!, nice[1]!).b)).toBeLessThan(
        0.01,
      );
    }
    // And over a long run the simulation converges to the same shares.
    const { cpu } = simulate([{ name: 'A' }, { name: 'B', nice: 5 }], 3, 3000);
    expect(Math.abs(cpu.B! / 3000 - pairShare(0, 5).b)).toBeLessThan(0.005);
  });

  it('places a waking task level with the lowest runnable task', () => {
    // S runs 1 ms (vruntime 1 ms) and sleeps 5; A runs from 1 ms. When S
    // wakes at 6 ms, A's vruntime is 5 ms, so S is placed at 5 ms, not 1:
    // it cannot claim the 5 ms it slept as owed CPU.
    const { decisions, waits } = simulate(
      [{ name: 'S', run: 1, sleep: 5 }, { name: 'A' }],
      3,
      8,
    );
    expect(decisions.find((d) => d.time === 7)).toMatchObject({
      reason: 'slice ended',
      candidates: [
        { name: 'S', vruntime: 5_000_000 },
        { name: 'A', vruntime: 6_000_000 },
      ],
      picked: 'S',
    });
    expect(waits.S).toEqual([1]);
    // In the lesson's example C never waits longer than one slice.
    const example = simulate(EXAMPLE.tasks, EXAMPLE.quantum, EXAMPLE.duration);
    expect(Math.max(...example.waits.C!)).toBeLessThanOrEqual(EXAMPLE.quantum);
  });

  it('agrees with the recording: most wake-ups run at once, some wait', () => {
    // On Linux most wake-ups beside a busy neighbour ran within 0.1 ms; about
    // one in four waited milliseconds, nearly all under 5 ms. The model,
    // which decides only at slice ends and sleeps, bounds the wait by the
    // slices ahead of the sleeper instead.
    const near = recorded.wakes.filter((w) => w.neighbour);
    const late = near.filter((w) => w.lateNs > 1_000_000);
    expect(near.filter((w) => w.lateNs < 100_000).length).toBeGreaterThan(
      near.length / 2,
    );
    expect(late.length).toBeGreaterThan(near.length / 10);
    expect(
      late.filter((w) => w.lateNs < 5_000_000).length / late.length,
    ).toBeGreaterThan(0.95);
    // Alone, nine in ten wake-ups ran within a millisecond.
    const alone = recorded.wakes
      .filter((w) => !w.neighbour)
      .map((w) => w.lateNs)
      .sort((a, b) => a - b);
    expect(alone[Math.floor(alone.length * 0.9)]!).toBeLessThan(1_000_000);
  });

  it('idles when nothing is runnable and merges runs', () => {
    const { timeline } = simulate([{ name: 'S', run: 1, sleep: 2 }], 4, 6);
    expect(timeline).toEqual(['S', null, null, 'S', null, null]);
    expect(runs(['A', 'A', null, 'B'])).toEqual([
      { task: 'A', start: 0, end: 2 },
      { task: null, start: 2, end: 3 },
      { task: 'B', start: 3, end: 4 },
    ]);
  });

  it('answers the practice card', () => {
    expect(solve([{ name: 'A' }, { name: 'B', nice: 10 }], 1, 10)).toEqual({
      order: ['A', 'B', 'A'],
      cpu: { A: 9, B: 1 },
    });
  });

  it('prints the verified example', () => {
    expect(schedulingExample()).toBe(
      [
        'order: A3 B3 C1 A3 C1 A3 C1 A3 B3 C1 A3 C1 A3 C1 A3 B3',
        'cpu over 36 ms: A 21 ms, B 9 ms, C 6 ms',
        "C's waits after waking: 0, 0, 3, 0, 0 ms",
        'busy pair at nice 0 and 5: 75.3% and 24.7%',
      ].join('\n'),
    );
  });
});
