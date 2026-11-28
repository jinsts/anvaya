import { expect, it } from 'vitest';
import type { Solution, Task } from './fair';
// solve(tasks, quantum, duration) runs the tasks on one CPU for `duration`
// milliseconds under the weighted fair model in README.md and returns
// { order, cpu }: who ran, in order, with consecutive milliseconds of one
// task merged (null while no task is runnable), and each task's milliseconds
// of CPU. Throw a RangeError for a nice value outside -20 to 19, a quantum,
// duration, run or sleep that is not a positive integer, a task given only
// one of run and sleep, or two tasks with the same name.
type Solve = (tasks: Task[], quantum: number, duration: number) => Solution;

export function contracts(solve: Solve) {
  it('unseen case 1: equal weights take turns', () =>
    expect(solve([{ name: 'A' }, { name: 'B' }], 2, 8)).toEqual({
      order: ['A', 'B', 'A', 'B'],
      cpu: { A: 4, B: 4 },
    }));
  it('unseen case 2: a nice gap of five', () =>
    expect(solve([{ name: 'A' }, { name: 'B', nice: 5 }], 2, 16)).toEqual({
      order: ['A', 'B', 'A', 'B', 'A'],
      cpu: { A: 12, B: 4 },
    }));
  it('unseen case 3: a negative nice value', () =>
    expect(solve([{ name: 'A', nice: -5 }, { name: 'B' }], 1, 8)).toEqual({
      order: ['A', 'B', 'A', 'B', 'A'],
      cpu: { A: 6, B: 2 },
    }));
  it('unseen case 4: a task that sleeps', () =>
    expect(
      solve([{ name: 'A' }, { name: 'S', run: 1, sleep: 2 }], 4, 12),
    ).toEqual({
      order: ['A', 'S', 'A', 'S', 'A'],
      cpu: { A: 10, S: 2 },
    }));
  it('unseen case 5: an idle CPU', () =>
    expect(solve([{ name: 'S', run: 2, sleep: 3 }], 5, 10)).toEqual({
      order: ['S', null, 'S', null],
      cpu: { S: 4 },
    }));
  it('unseen case 6: a light busy task and a sleeper', () =>
    expect(
      solve(
        [
          { name: 'web', run: 2, sleep: 4 },
          { name: 'batch', nice: 10 },
        ],
        3,
        20,
      ),
    ).toEqual({
      order: ['web', 'batch', 'web', 'batch', 'web', 'batch'],
      cpu: { web: 6, batch: 14 },
    }));
  it('unseen case 7: three tasks, one-millisecond slices', () =>
    expect(solve([{ name: 'A' }, { name: 'B' }, { name: 'C' }], 1, 6)).toEqual({
      order: ['A', 'B', 'C', 'A', 'B', 'C'],
      cpu: { A: 2, B: 2, C: 2 },
    }));
  it('unseen case 8: nice outside -20 to 19', () =>
    expect(() => solve([{ name: 'A', nice: 20 }], 1, 1)).toThrow(RangeError));
  it('unseen case 9: a zero quantum', () =>
    expect(() => solve([{ name: 'A' }], 0, 5)).toThrow(RangeError));
  it('unseen case 10: two tasks with one name', () =>
    expect(() => solve([{ name: 'A' }, { name: 'A' }], 1, 5)).toThrow(
      RangeError,
    ));
  it('unseen case 11: run without sleep', () =>
    expect(() => solve([{ name: 'A', run: 2 }], 1, 5)).toThrow(RangeError));
}
