import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  addByGroups,
  sumTrace,
  simdExample,
  sumByLanes,
  sumInOrder,
  vectorPlan,
  vectorizedLoops,
} from './lanes';

const dir = 'labs/computer-architecture-execution/simd';
const read = (file: string) => readFileSync(`${dir}/${file}`, 'utf8');

it('splits n elements into full vectors and a scalar remainder', () => {
  expect(vectorPlan(10, 4)).toMatchObject({
    vectorIterations: 2,
    remainder: 2,
    loopIterations: 4,
  });
  expect(vectorPlan(8, 4).remainder).toBe(0);
  expect(vectorPlan(3, 4)).toMatchObject({ vectorIterations: 0, remainder: 3 });
  expect(vectorPlan(0, 8).groups).toEqual([]);
  expect(() => vectorPlan(5, 3)).toThrow(RangeError);
  const a = Array.from({ length: 10 }, (_, i) => i);
  const b = a.map((i) => 100 * i);
  // The same results as the native program checks: out[i] = 101 i.
  expect(addByGroups(a, b, 4)).toEqual(a.map((i) => 101 * i));
});

it('gives a different binary32 sum when lanes reassociate the additions', () => {
  const values = [2 ** 24, 1, 1, 1, 1, 1, 1, 1];
  expect(sumInOrder(values)).toBe(2 ** 24);
  expect(sumByLanes(values)).toBe(2 ** 24 + 6);
  const trace = sumTrace(values);
  expect(trace.lanes).toEqual([2 ** 24, 2, 2, 2]);
  expect(trace.pairs).toEqual([2 ** 24 + 2, 4]);
  expect(trace.total).toBe(sumByLanes(values));
  expect(trace.inOrder.at(-1)).toBe(sumInOrder(values));
  expect(() => sumTrace([1, 2])).toThrow(RangeError);
  // Small integers are exact in any order, as in the native check.
  const small = Array.from({ length: 10 }, (_, i) => i);
  expect(sumInOrder(small)).toBe(45);
  expect(sumByLanes(small)).toBe(45);
});

it('matches the recorded listings and GCC vectorization reports', () => {
  expect(read('add-O2.txt')).toMatch(/paddd/);
  expect(read('add-scalar.txt')).not.toMatch(/xmm/);
  // Without permission to reassociate, -O3 still adds one float at a time.
  const inOrder = read('sum-O3.txt');
  expect(inOrder.match(/addss/g)!.length).toBeGreaterThanOrEqual(4);
  expect(inOrder).not.toMatch(/addps/);
  expect(read('sum-O3-reassociate.txt')).toMatch(/addps/);
  expect(vectorizedLoops(read('report-O2.txt'))).toEqual([
    { line: 7, bytes: 16 },
  ]);
  expect(vectorizedLoops(read('report-O3.txt')).map((l) => l.line)).toContain(
    12,
  );
  expect(() => vectorizedLoops('x')).toThrow();
});

it('prints the lesson output', () => {
  expect(simdExample()).toBe(
    'n = 10, 4 lanes: 2 vector iterations + 2 scalar\nin order: 16777216; by lanes: 16777222; exact: 16777223',
  );
});
