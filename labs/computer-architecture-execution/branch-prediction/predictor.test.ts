import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { conditionalJumps, summarizeVariants } from './measurement';
import {
  ROB_PROGRAM,
  STREAMS,
  accuracy,
  predict,
  predictorExample,
  reorderBuffer,
} from './predictor';

const stream = (id: string) => STREAMS.find((s) => s.id === id)!.outcomes;
const marks = (id: string, kind: 'one-bit' | 'two-bit') =>
  predict(stream(id), kind)
    .map((s) => `${s.state}${s.correct ? '' : '!'}`)
    .join(' ');

it('mispredicts a loop branch once per exit with two bits, twice with one', () => {
  expect(marks('loop', 'two-bit')).toBe(
    '1! 2 3 3 3 3! 2 3 3 3 3 3! 2 3 3 3 3 3! 2 3 3 3 3 3!',
  );
  expect(marks('loop', 'one-bit')).toBe(
    '0! 1 1 1 1 1! 0! 1 1 1 1 1! 0! 1 1 1 1 1! 0! 1 1 1 1 1!',
  );
});

it('saturates, and an alternating pattern defeats both predictors', () => {
  const steps = predict([true, true, true, true, false, true], 'two-bit', 0);
  expect(steps.map((s) => s.next)).toEqual([1, 2, 3, 3, 2, 3]);
  expect(steps[5]!.correct).toBe(true); // one surprise does not flip it
  expect(accuracy(predict(stream('alternating'), 'two-bit'))).toBe(0);
  expect(accuracy(predict(stream('alternating'), 'one-bit'))).toBe(0);
  expect(() => predict([true], 'one-bit', 2)).toThrow(RangeError);
  expect(() => predict([true, 1 as never], 'two-bit')).toThrow(RangeError);
  expect(() => predict(['T' as never], 'one-bit')).toThrow(RangeError);
  expect(accuracy([])).toBe(1);
});

it('predicts sorted data far better than random data', () => {
  const sorted = stream('sorted');
  expect(sorted.indexOf(true)).toBe(sorted.lastIndexOf(false) + 1);
  expect(accuracy(predict(sorted, 'two-bit'))).toBeGreaterThan(0.9);
  expect(accuracy(predict(stream('random'), 'two-bit'))).toBeLessThan(0.7);
});

it('executes independent work early but commits in program order', () => {
  const ooo = reorderBuffer(ROB_PROGRAM, 'out-of-order');
  const inOrder = reorderBuffer(ROB_PROGRAM, 'in-order');
  expect(ooo.rows.map((r) => [r.start, r.complete, r.commit])).toEqual([
    [1, 8, 9],
    [9, 9, 10],
    [3, 5, 11],
    [4, 4, 12],
    [6, 6, 13],
  ]);
  expect(inOrder.rows.map((r) => r.start)).toEqual([1, 9, 10, 11, 13]);
  for (const { rows } of [ooo, inOrder])
    for (let i = 1; i < rows.length; i++)
      expect(rows[i]!.commit).toBeGreaterThan(rows[i - 1]!.commit);
  expect([ooo.cycles, inOrder.cycles]).toEqual([13, 15]);
  expect(() =>
    reorderBuffer([{ text: 'x', latency: 1, needs: [0] }], 'out-of-order'),
  ).toThrow(RangeError);
});

it('summarizes the recorded measurement and finds the branch only where it is', () => {
  const dir = 'labs/computer-architecture-execution/branch-prediction';
  const data = JSON.parse(readFileSync(`${dir}/sorted-random.json`, 'utf8'));
  const summary = summarizeVariants(data.variants);
  expect(summary.map((s) => s.label)).toEqual(['vector', 'cmov', 'branch']);
  for (const s of summary) {
    expect(s.random.values).toHaveLength(7);
    expect(s.sorted.values).toHaveLength(7);
  }
  const branch = summary.find((s) => s.label === 'branch')!;
  // The recorded data: only the build with a real branch depends on order.
  expect(branch.ratio).toBeGreaterThan(4);
  for (const label of ['vector', 'cmov'])
    expect(summary.find((s) => s.label === label)!.ratio).toBeLessThan(1.5);
  const listing = (v: string) => readFileSync(`${dir}/kernel-${v}.txt`, 'utf8');
  expect(conditionalJumps(listing('branch'))).toEqual([
    'je .L5',
    'jns .L3',
    'jne .L4',
  ]);
  expect(listing('cmov')).toMatch(/cmovs/);
  expect(conditionalJumps(listing('cmov'))).not.toContain('jns .L3');
  expect(listing('vector')).toMatch(/pcmpgtb/);
});

it('prints the lesson output', () => {
  expect(predictorExample()).toBe(
    [
      'loop: one-bit 67%, two-bit 79%',
      'random: one-bit 54%, two-bit 58%',
      'sorted: one-bit 96%, two-bit 92%',
      'alternating: one-bit 0%, two-bit 0%',
      'in-order: last commit in cycle 15',
      'out-of-order: last commit in cycle 13',
    ].join('\n'),
  );
});
