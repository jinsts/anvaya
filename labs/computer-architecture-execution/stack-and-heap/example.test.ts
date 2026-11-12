import { describe, expect, it } from 'vitest';
import { LifetimeModel, lifetimeExample } from './example';

describe('separate frame and allocation lifetimes', () => {
  it('returns in reverse call order without reclaiming independent allocations', () => {
    const memory = new LifetimeModel(64);
    memory.enter('outer', 16);
    memory.enter('inner', 24);
    const id = memory.allocate(100);
    expect(memory.stackBytes).toBe(40);
    expect(memory.leave()).toBe('inner');
    expect(memory.heapBytes).toBe(100);
    expect(memory.leave()).toBe('outer');
    expect(memory.stackBytes).toBe(0);
    memory.free(id);
    expect(memory.heapBytes).toBe(0);
  });

  it('allows the exact stack limit and leaves state unchanged on overflow', () => {
    const memory = new LifetimeModel(32);
    memory.enter('full', 32);
    expect(() => memory.enter('extra', 1)).toThrow('Model stack overflow');
    expect(memory.stackBytes).toBe(32);
    expect(memory.leave()).toBe('full');
    expect(() => memory.leave()).toThrow('No frame');
  });

  it('releases heap allocations in any order and rejects double free', () => {
    const memory = new LifetimeModel(64);
    const first = memory.allocate(10);
    const second = memory.allocate(20);
    memory.free(first);
    expect(memory.heapBytes).toBe(20);
    expect(() => memory.free(first)).toThrow('already freed');
    memory.free(second);
    expect(() => memory.free(999)).toThrow('Unknown');
  });

  it.each([0, -1, 1.5, Infinity, NaN])('rejects invalid size %s', (size) => {
    expect(() => new LifetimeModel(size)).toThrow(RangeError);
    const memory = new LifetimeModel(64);
    expect(() => memory.enter('frame', size)).toThrow(RangeError);
    expect(() => memory.allocate(size)).toThrow(RangeError);
    expect(() => memory.enter(' ', 1)).toThrow(RangeError);
    expect(memory.stackBytes).toBe(0);
    expect(memory.heapBytes).toBe(0);
  });

  it('keeps aggregate allocation accounting within the safe integer range', () => {
    const memory = new LifetimeModel(64);
    const id = memory.allocate(Number.MAX_SAFE_INTEGER);
    expect(() => memory.allocate(1)).toThrow('safe integer range');
    expect(memory.heapBytes).toBe(Number.MAX_SAFE_INTEGER);
    memory.free(id);
    expect(memory.allocate(1)).toBe(2);
  });

  it('checks the exact output displayed by the lesson', () => {
    expect(lifetimeExample()).toBe(
      'during call: stack=40, heap=128\n' +
        'after return: stack=16, heap=128\n' +
        'after free: heap=0',
    );
  });
});
