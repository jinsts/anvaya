import { expect, it } from 'vitest';
import {
  STORY,
  STORY_STACK_LIMIT,
  traceLifetimes,
  type LifetimeEvent,
} from './trace';

const snapshots = traceLifetimes(
  STORY.map((s) => s.event),
  STORY_STACK_LIMIT,
);

it('keeps the buffer alive after its creating frame returns', () => {
  const afterReturn = snapshots[4]!;
  expect(afterReturn.frames.map((f) => f.name)).toEqual(['main']);
  expect(afterReturn.frames[0]!.locals).toEqual([{ name: 'data', ref: 1 }]);
  expect(afterReturn.heap).toEqual([{ id: 1, bytes: 128, live: true }]);
  expect([afterReturn.stackBytes, afterReturn.heapBytes]).toEqual([16, 128]);
  // During the call both frames exist and buf holds the handle.
  expect(snapshots[3]!.frames.map((f) => f.locals)).toEqual([
    [{ name: 'data', ref: null }],
    [{ name: 'buf', ref: 1 }],
  ]);
});

it('leaves a dangling handle after free until it is cleared', () => {
  const afterFree = snapshots[5]!;
  expect(afterFree.frames[0]!.locals[0]).toEqual({ name: 'data', ref: 1 });
  expect(afterFree.heap[0]!.live).toBe(false);
  expect(afterFree.heapBytes).toBe(0);
  expect(snapshots[6]!.frames[0]!.locals[0]!.ref).toBeNull();
  expect(snapshots.at(-1)).toMatchObject({ frames: [], stackBytes: 0 });
});

it('answers each story question from the model', () => {
  for (const [i, step] of STORY.entries()) {
    if (!step.question) continue;
    const after = snapshots[i + 1]!;
    if (step.event.kind === 'return')
      expect(step.question.answer).toBe(after.heap[0]!.live ? 0 : 1);
    if (step.event.kind === 'free')
      expect(step.question.answer).toBe(
        after.frames[0]!.locals[0]!.ref !== null ? 0 : 1,
      );
  }
});

it('rejects double free, unknown locals, overflow and empty returns', () => {
  const call: LifetimeEvent = {
    kind: 'call',
    frame: 'f',
    bytes: 8,
    locals: ['p'],
  };
  expect(() =>
    traceLifetimes(
      [
        call,
        { kind: 'allocate', bytes: 4, into: 'p' },
        { kind: 'free', local: 'p' },
        { kind: 'free', local: 'p' },
      ],
      64,
    ),
  ).toThrow(RangeError);
  expect(() =>
    traceLifetimes([call, { kind: 'free', local: 'p' }], 64),
  ).toThrow(/no handle/);
  expect(() =>
    traceLifetimes([call, { kind: 'clear', local: 'q' }], 64),
  ).toThrow(/no local/);
  expect(() => traceLifetimes([call, call], 12)).toThrow(/overflow/);
  expect(() => traceLifetimes([{ kind: 'return' }], 64)).toThrow(RangeError);
});
