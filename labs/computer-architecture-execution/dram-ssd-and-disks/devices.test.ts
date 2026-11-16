import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  DRIVE,
  Ftl,
  LADDER,
  devicesExample,
  diskAccess,
  dramAccesses,
  ftlScenario,
} from './devices';
import {
  byLevel,
  formatBytes,
  levelFor,
  parseCaches,
  summarize,
} from './sweep';

const sweep = JSON.parse(
  readFileSync(
    'labs/computer-architecture-execution/dram-ssd-and-disks/sweep.json',
    'utf8',
  ),
);

it('keeps the sourced ladder ordered from fastest to slowest', () => {
  for (let i = 1; i < LADDER.length; i++)
    expect(LADDER[i]!.low).toBeGreaterThanOrEqual(LADDER[i - 1]!.high);
  expect(LADDER.map((l) => l.level)).toContain('Hard disk');
});

it('prices open-row hits, empty banks and row conflicts', () => {
  const timing = { cas: 4, rcd: 4, rp: 4 };
  expect(
    dramAccesses([7, 7, 7, 9, 7], timing).map((a) => [a.kind, a.cycles]),
  ).toEqual([
    ['row empty', 8],
    ['row hit', 4],
    ['row hit', 4],
    ['row conflict', 12],
    ['row conflict', 12],
  ]);
  expect(() => dramAccesses([1], { cas: 0, rcd: 4, rp: 4 })).toThrow(
    RangeError,
  );
});

it('splits a disk access into seek, rotation and transfer', () => {
  const random = diskAccess(DRIVE, 4096);
  expect(random.rotationMs).toBeCloseTo(4.1667, 4);
  expect(random.transferMs).toBeCloseTo(0.0273, 4);
  expect(random.totalMs).toBeCloseTo(12.194, 3);
  expect(random.rateMBps).toBeCloseTo(0.336, 3);
  const big = diskAccess(DRIVE, 100e6);
  expect(big.rateMBps).toBeGreaterThan(140);
  expect(() => diskAccess({ ...DRIVE, rpm: 0 }, 1)).toThrow(RangeError);
});

it('erases whole blocks and copies valid pages during garbage collection', () => {
  const { shots, ftl } = ftlScenario();
  const states = (i: number) =>
    shots[i]!.state.blocks.map((b) =>
      b
        .map((p) =>
          p.state === 'erased'
            ? '.'
            : p.state === 'valid'
              ? `${p.page}`
              : `x${p.page}`,
        )
        .join(' '),
    );
  expect(states(1)).toEqual(['x0 x1 2 3', 'x4 x5 6 7', '0 1 4 5', '. . . .']);
  expect(states(2)).toEqual(['. . . .', 'x4 x5 6 7', '0 1 4 5', '3 2 . .']);
  expect(shots[2]!.state.reserve).toBe(0);
  expect([ftl.hostWrites, ftl.flashWrites, ftl.erases]).toEqual([13, 14, 1]);
  expect(ftl.writeAmplification).toBeCloseTo(14 / 13, 10);
  expect(() => ftl.write(8)).toThrow(RangeError);
  expect(() => new Ftl(2, 4)).toThrow(RangeError);
});

it('summarizes the recorded sweep against the recorded cache sizes', () => {
  const caches = parseCaches(sweep.caches);
  expect(caches).toEqual([
    { name: 'L1d', bytes: 48 * 1024 },
    { name: 'L2', bytes: 3 * 1024 ** 2 },
    { name: 'L3', bytes: 24 * 1024 ** 2 },
  ]);
  const summary = summarize(sweep.records);
  expect(summary).toHaveLength(33);
  expect(summary.every((s) => s.reps === 5)).toBe(true);
  expect(summary[0]!.size).toBe(4096);
  expect(levelFor(48 * 1024, caches)).toBe('L1d');
  expect(levelFor(32 * 1024 ** 2, caches)).toBe('DRAM');
  const levels = byLevel(summary, caches);
  expect(levels.map((l) => l.level)).toEqual(['L1d', 'L2', 'L3', 'DRAM']);
  // Each level is slower than the one before it in this recording.
  for (let i = 1; i < levels.length; i++)
    expect(levels[i]!.median).toBeGreaterThan(levels[i - 1]!.median);
  expect(formatBytes(3 * 1024 ** 2)).toBe('3 MiB');
});

it('prints the lesson output', () => {
  expect(devicesExample()).toBe(
    [
      'disk 4 KiB random: 12.19 ms, 0.34 MB/s',
      'disk 1 MiB: 19.16 ms, 54.7 MB/s',
      'DRAM rows 7,7,7,9,7: 8 + 4 + 4 + 12 + 12 cycles',
      'flash: 13 host writes, 14 page programs, 1 erase, amplification 1.08',
    ].join('\n'),
  );
});

it('backs the lesson estimates with the recorded sweep', () => {
  const caches = parseCaches(sweep.caches);
  const summary = summarize(sweep.records);
  const dram = byLevel(summary, caches).find((l) => l.level === 'DRAM')!;
  // A million dependent DRAM loads: a fraction of a second.
  expect((1e6 * dram.median) / 1e9).toBeGreaterThan(0.05);
  expect((1e6 * dram.median) / 1e9).toBeLessThan(1);
  // 100,000 nodes of 64 bytes, 6.1 MiB, random order: a millisecond or two.
  const sixMiB = summary.find((s) => s.size === 6 * 1024 ** 2)!;
  expect(levelFor(100_000 * 64, caches)).toBe('L3');
  const ms = (100_000 * sixMiB.median) / 1e6;
  expect(ms).toBeGreaterThan(0.5);
  expect(ms).toBeLessThan(3);
  // The practice disk read: 5 ms seek, 10,000 RPM, 180 MB/s, 4 KiB.
  expect(
    diskAccess({ averageSeekMs: 5, rpm: 10000, transferMBps: 180 }, 4096)
      .totalMs,
  ).toBeCloseTo(8.0228, 3);
});
