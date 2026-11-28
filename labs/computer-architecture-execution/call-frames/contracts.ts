import { expect, it } from 'vitest';
// solve(events) tracks one x86-64 function's stack pointer as its depth, the
// bytes below rsp's value at entry, and returns the depth after each event.
// 'push' and 'pop' move 8 bytes; 'sub N' and 'add N' move N bytes; 'frame'
// (movq %rsp, %rbp) remembers the depth; 'leave' returns to that depth and pops
// the saved rbp; 'call' runs another function that returns, and needs rsp
// 16-byte aligned, which at depth d means d − 8 is a multiple of 16; 'ret' needs
// every byte this function pushed popped again. Throw a RangeError for a
// misaligned call, rsp above its entry value, a ret with bytes still pushed, a
// leave without a frame, an event after ret, or an unknown or malformed event.
export function contracts(solve: (events: string[]) => number[]) {
  it('unseen case 1', () =>
    expect(solve(['sub 8', 'call', 'add 8', 'ret'])).toEqual([8, 8, 0, 0]));
  it('unseen case 2', () =>
    expect(solve(['push', 'frame', 'sub 32', 'call', 'leave', 'ret'])).toEqual([
      8, 8, 40, 40, 0, 0,
    ]));
  it('unseen case 3', () =>
    expect(solve(['sub 24', 'add 24', 'ret'])).toEqual([24, 0, 0]));
  it('unseen case 4', () => expect(solve([])).toEqual([]));
  it('unseen case 5', () =>
    expect(() => solve(['push', 'push', 'call'])).toThrow(RangeError));
  it('unseen case 6', () => expect(() => solve(['pop'])).toThrow(RangeError));
  it('unseen case 7', () =>
    expect(() => solve(['push', 'ret'])).toThrow(RangeError));
  it('unseen case 8', () => {
    expect(() => solve(['push', 'leave'])).toThrow(RangeError);
    expect(() => solve(['sub -8'])).toThrow(RangeError);
  });
}
