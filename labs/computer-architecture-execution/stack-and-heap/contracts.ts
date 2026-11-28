import { expect, it } from 'vitest';
import type { LifetimeEvent } from './trace';
// solve(events) runs call, allocate, return, free and clear events and
// returns the ids of objects still allocated and the "frame.local" names, in
// active frames from oldest to newest, that hold a handle to a freed object.
// Object ids count from 1 in allocation order. Invalid events, such as a
// double free, throw a RangeError.
type Report = { live: number[]; dangling: string[] };
export function contracts(solve: (events: LifetimeEvent[]) => Report) {
  const main = (locals: string[]): LifetimeEvent => ({
    kind: 'call',
    frame: 'main',
    bytes: 16,
    locals,
  });
  it('unseen case 1', () =>
    expect(
      solve([
        main(['p', 'r']),
        { kind: 'allocate', bytes: 32, into: 'p' },
        {
          kind: 'call',
          frame: 'release',
          bytes: 16,
          locals: ['q'],
          pass: { q: 'p' },
        },
        { kind: 'free', local: 'q' },
        { kind: 'return' },
        { kind: 'allocate', bytes: 8, into: 'r' },
      ]),
    ).toEqual({ live: [2], dangling: ['main.p'] }));
  it('unseen case 2', () =>
    expect(
      solve([
        main(['p']),
        { kind: 'allocate', bytes: 32, into: 'p' },
        {
          kind: 'call',
          frame: 'mid',
          bytes: 16,
          locals: ['m'],
          pass: { m: 'p' },
        },
        {
          kind: 'call',
          frame: 'release',
          bytes: 16,
          locals: ['q'],
          pass: { q: 'm' },
        },
        { kind: 'free', local: 'q' },
      ]),
    ).toEqual({ live: [], dangling: ['main.p', 'mid.m', 'release.q'] }));
  it('unseen case 3', () =>
    expect(
      solve([
        main(['a']),
        { kind: 'call', frame: 'make', bytes: 16, locals: ['tmp'] },
        { kind: 'allocate', bytes: 8, into: 'tmp' },
        { kind: 'return', value: 'tmp', into: 'a' },
      ]),
    ).toEqual({ live: [1], dangling: [] }));
  it('unseen case 4', () =>
    expect(
      solve([
        main(['a', 'b']),
        { kind: 'allocate', bytes: 8, into: 'a' },
        { kind: 'allocate', bytes: 8, into: 'b' },
        { kind: 'free', local: 'a' },
        { kind: 'clear', local: 'a' },
      ]),
    ).toEqual({ live: [2], dangling: [] }));
  it('unseen case 5', () =>
    expect(() =>
      solve([
        main(['a']),
        { kind: 'allocate', bytes: 8, into: 'a' },
        { kind: 'free', local: 'a' },
        { kind: 'free', local: 'a' },
      ]),
    ).toThrow(RangeError));
}
