import { describe, expect, it } from 'vitest';
import {
  advance,
  interruptDetection,
  ioExample,
  owner,
  pollingDetection,
  type Event,
  type Request,
} from './example';

describe('receive-buffer lifecycle model', () => {
  const ready: Request = { phase: 'ready', capacity: 8, transferred: 0 };

  it('checks the displayed output exactly', () => {
    expect(ioExample()).toBe(
      'submitted: device\ncompleted: device\nreclaimed: host (4 bytes)',
    );
  });

  it('supports failure, reclaim, and reuse without mutating the original', () => {
    const submitted = advance(ready, { type: 'submit' });
    const failed = advance(submitted, { type: 'fail' });
    expect(owner(failed)).toBe('device');
    const reclaimed = advance(failed, { type: 'reclaim' });
    expect(owner(reclaimed)).toBe('host');
    expect(advance(reclaimed, { type: 'submit' })).toEqual(submitted);
    expect(ready).toEqual({ phase: 'ready', capacity: 8, transferred: 0 });
  });

  it.each([0, 8])('accepts a completion of %s bytes', (bytes) => {
    const completed = advance(advance(ready, { type: 'submit' }), {
      type: 'complete',
      bytes,
    });
    expect(completed.transferred).toBe(bytes);
  });

  it('accepts an explicitly empty buffer', () => {
    const empty = { ...ready, capacity: 0 };
    expect(
      advance(advance(empty, { type: 'submit' }), {
        type: 'complete',
        bytes: 0,
      }).phase,
    ).toBe('completed');
  });

  it.each([-1, 0.5, Number.NaN, Infinity, 9])(
    'rejects invalid completion size %s',
    (bytes) => {
      expect(() =>
        advance(advance(ready, { type: 'submit' }), {
          type: 'complete',
          bytes,
        }),
      ).toThrow(RangeError);
    },
  );

  it.each([
    ['ready', { type: 'complete', bytes: 1 }],
    ['ready', { type: 'reclaim' }],
    ['in-flight', { type: 'submit' }],
    ['in-flight', { type: 'reclaim' }],
    ['completed', { type: 'complete', bytes: 1 }],
    ['failed', { type: 'submit' }],
  ] as const)('rejects %s -> %j', (phase, event) => {
    expect(() => advance({ ...ready, phase }, event as Event)).toThrow();
  });

  it('rejects malformed byte counts before transitioning', () => {
    expect(() =>
      advance({ ...ready, capacity: -1 }, { type: 'submit' }),
    ).toThrow(RangeError);
    expect(() =>
      advance({ ...ready, transferred: 9 }, { type: 'submit' }),
    ).toThrow(RangeError);
  });
});

describe('polling and interrupt timeline', () => {
  it('finds a completion at the first check after it is ready', () => {
    expect(pollingDetection(10, 4)).toEqual({
      checkTimes: [4, 8, 12],
      checks: 3,
      detectedAt: 12,
      delay: 2,
    });
    expect(pollingDetection(10, 2)).toEqual({
      checkTimes: [2, 4, 6, 8, 10],
      checks: 5,
      detectedAt: 10,
      delay: 0,
    });
    expect(pollingDetection(0, 4)).toMatchObject({ checks: 1, delay: 4 });
    expect(interruptDetection(10)).toEqual({
      checks: 0,
      handlerEntries: 1,
      detectedAt: 10,
      delay: 0,
    });
  });

  it.each([
    [-1, 4],
    [10, 0],
    [Number.NaN, 4],
    [10, Infinity],
  ])('rejects ready time %s with interval %s', (ready, interval) => {
    expect(() => pollingDetection(ready, interval)).toThrow(RangeError);
  });
});
