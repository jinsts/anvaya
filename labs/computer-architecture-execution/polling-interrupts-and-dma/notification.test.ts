import { describe, expect, it } from 'vitest';
import {
  BURST,
  coalescedInterrupts,
  interruptDetection,
  interruptEach,
  notificationExample,
  pollCompletions,
  pollingDetection,
  transferTimeline,
} from './notification';

describe('one completion: polling against an interrupt', () => {
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

describe('many completions', () => {
  it('polls until the last completion, counting the empty checks', () => {
    expect(pollCompletions(BURST, 4)).toEqual({
      checks: 4,
      emptyChecks: 2,
      handlerEntries: 0,
      delays: [3, 2, 1, 0, 3],
    });
    // One poll can find several completions; an empty list needs no poll.
    expect(pollCompletions([4, 5, 6], 2).emptyChecks).toBe(1);
    expect(pollCompletions([], 5)).toEqual({
      checks: 0,
      emptyChecks: 0,
      handlerEntries: 0,
      delays: [],
    });
    // Delays stay in input order.
    expect(pollCompletions([12, 3], 3).delays).toEqual([0, 0]);
  });

  it('enters a handler per completion, or once per coalesced batch', () => {
    expect(interruptEach(BURST)).toEqual({
      checks: 0,
      emptyChecks: 0,
      handlerEntries: 5,
      delays: [0, 0, 0, 0, 0],
    });
    expect(coalescedInterrupts(BURST, 3, 4)).toEqual({
      checks: 0,
      emptyChecks: 0,
      handlerEntries: 2,
      delays: [2, 1, 0, 4, 3],
    });
    // A timeout fires before a large batch fills.
    expect(coalescedInterrupts([1, 2, 10], 5, 3).delays).toEqual([3, 2, 3]);
    // A batch of one is an interrupt per completion.
    expect(coalescedInterrupts(BURST, 1, 100)).toEqual(interruptEach(BURST));
  });

  it('refuses invalid times, intervals and batches', () => {
    expect(() => pollCompletions([1], 0)).toThrow(RangeError);
    expect(() => pollCompletions([-1], 2)).toThrow(RangeError);
    expect(() => interruptEach([Number.NaN])).toThrow(RangeError);
    expect(() => coalescedInterrupts([1], 0, 2)).toThrow(RangeError);
    expect(() => coalescedInterrupts([1], 2, -1)).toThrow(RangeError);
  });
});

describe('who moves the bytes', () => {
  it('keeps the CPU busy per word with PIO, and only at the ends with DMA', () => {
    const pio = transferTimeline(4, 'pio');
    expect(pio.cpu).toEqual(['setup', 'copy', 'copy', 'copy', 'copy']);
    expect(pio.engine.every((s) => s === 'idle')).toBe(true);
    const dma = transferTimeline(4, 'dma');
    expect(dma.cpu).toEqual([
      'setup',
      'free',
      'free',
      'free',
      'free',
      'interrupt',
    ]);
    expect(dma.engine.filter((s) => s === 'copy')).toHaveLength(4);
    expect([pio.cpuBusy, dma.cpuBusy]).toEqual([5, 2]);
    expect(() => transferTimeline(0, 'dma')).toThrow(RangeError);
  });
});

it('checks the exact output displayed by the lesson', () => {
  expect(notificationExample()).toBe(
    'ready at 10, poll every 4: found at 12 after 3 checks\n' +
      'burst, poll every 4: 4 checks (2 empty), delays 3 2 1 0 3\n' +
      'burst, interrupt each: 5 handler entries, delays 0 0 0 0 0\n' +
      'burst, coalesce 3 or 4 units: 2 handler entries, delays 2 1 0 4 3\n' +
      '8 words: CPU busy 9 units with PIO, 2 with DMA',
  );
});
