import { expect, it } from 'vitest';
import type { Action, ProcessResult } from './process';
// solve(program) runs a program of fork, exec, wait, exit and pause actions
// (see README.md) and returns every process it created, P1 first, as
// { name, parent, image, status, end }:
// - name: P1, then P2, P3 … in the order the fork actions appear, reading a
//   fork's own actions before what follows it; parent: its creator's name.
// - image: 'program', or the name a successful exec gave it.
// - status: its exit status, or null if it never exits.
// - end: 'reaped by parent' (P1 counts as reaped by the shell when it exits),
//   'reaped by init' (its parent exited first), 'zombie' (exited, parent still
//   running and never waits for it) or 'running' (never exits).
// A fork's child runs its actions and then exits with 0. A successful exec
// ends the actions after it; a failed one (no `exits`) does not. `wait`
// reaps the oldest child not yet reaped, blocking until it exits, or returns
// at once if there is none. Throw a RangeError for a status outside 0–255 and
// a TypeError for anything that is not an action.
const row = (
  name: string,
  parent: string | null,
  image: string,
  status: number | null,
  end: ProcessResult['end'],
) => ({ name, parent, image, status, end });

export function contracts(solve: (program: Action[]) => ProcessResult[]) {
  it('unseen case 1', () =>
    expect(
      solve([
        { fork: [{ exec: 'grep', exits: 1 }] },
        { wait: true },
        { exit: 0 },
      ]),
    ).toEqual([
      row('P1', null, 'program', 0, 'reaped by parent'),
      row('P2', 'P1', 'grep', 1, 'reaped by parent'),
    ]));
  it('unseen case 2', () =>
    expect(
      solve([
        { fork: [{ exec: 'nope' }, { exec: 'cat', exits: 2 }, { exit: 9 }] },
        { wait: true },
      ]),
    ).toEqual([
      row('P1', null, 'program', 0, 'reaped by parent'),
      row('P2', 'P1', 'cat', 2, 'reaped by parent'),
    ]));
  it('unseen case 3', () =>
    expect(
      solve([
        { fork: [{ exit: 4 }] },
        { fork: [{ exit: 5 }] },
        { wait: true },
        { pause: true },
      ]),
    ).toEqual([
      row('P1', null, 'program', null, 'running'),
      row('P2', 'P1', 'program', 4, 'reaped by parent'),
      row('P3', 'P1', 'program', 5, 'zombie'),
    ]));
  it('unseen case 4', () =>
    expect(
      solve([{ fork: [{ fork: [{ exit: 6 }] }, { exit: 1 }] }, { wait: true }]),
    ).toEqual([
      row('P1', null, 'program', 0, 'reaped by parent'),
      row('P2', 'P1', 'program', 1, 'reaped by parent'),
      row('P3', 'P2', 'program', 6, 'reaped by init'),
    ]));
  it('unseen case 5', () =>
    expect(
      solve([
        { fork: [{ fork: [] }, { fork: [{ pause: true }] }] },
        { fork: [{ exec: 'ls', exits: 0 }] },
        { wait: true },
        { wait: true },
      ]),
    ).toEqual([
      row('P1', null, 'program', 0, 'reaped by parent'),
      row('P2', 'P1', 'program', 0, 'reaped by parent'),
      row('P3', 'P2', 'program', 0, 'reaped by init'),
      row('P4', 'P2', 'program', null, 'running'),
      row('P5', 'P1', 'ls', 0, 'reaped by parent'),
    ]));
  it('unseen case 6', () =>
    expect(
      solve([{ fork: [{ pause: true }] }, { wait: true }, { exit: 1 }]),
    ).toEqual([
      row('P1', null, 'program', null, 'running'),
      row('P2', 'P1', 'program', null, 'running'),
    ]));
  it('unseen case 7', () =>
    expect(
      solve([{ wait: true }, { exec: 'date', exits: 0 }, { exit: 3 }]),
    ).toEqual([row('P1', null, 'date', 0, 'reaped by parent')]));
  it('unseen case 8', () =>
    expect(() => solve([{ fork: [{ exit: 256 }] }])).toThrow(RangeError));
  it('unseen case 9', () =>
    expect(() => solve([{ exec: 'x', exits: 1.5 }])).toThrow(RangeError));
  it('unseen case 10', () =>
    expect(() => solve([{ spawn: 'x' } as unknown as Action])).toThrow(
      TypeError,
    ));
}
