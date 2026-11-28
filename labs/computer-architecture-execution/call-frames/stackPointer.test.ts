import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  STACK_TOP,
  int32Bytes,
  parseListing,
  run,
} from '../reading-assembly/x86';
import {
  framesExample,
  maxDepth,
  stackEvents,
  stackSteps,
  trackStack,
} from './stackPointer';

const lab = 'labs/computer-architecture-execution';
const text = (file: string) =>
  readFileSync(`${lab}/reading-assembly/${file}`, 'utf8');
const listing = (file: string) => parseListing(text(file));
const sumO0 = listing('sum-O0.txt');
const sumO2 = listing('sum-O2.txt');
const scaleO0 = listing('scale-O0.txt');
const scaleO2 = listing('scale-O2.txt');

describe('the stack-pointer rules of one function', () => {
  it('reads the stack events of GCC’s listings', () => {
    expect(stackEvents(scaleO0)).toEqual([
      'push',
      'frame',
      'sub 16',
      'call',
      'leave',
      'ret',
    ]);
    expect(stackEvents(scaleO2)).toEqual(['push', 'call', 'pop', 'ret']);
    expect(stackEvents(sumO0)).toEqual(['push', 'frame', 'pop', 'ret']);
    expect(stackEvents(sumO2)).toEqual(['ret', 'ret']);
    expect(stackSteps(scaleO0).map((s) => s.text)).toEqual([
      'pushq %rbp',
      'movq %rsp, %rbp',
      'subq $16, %rsp',
      'call sum_to@PLT',
      'leave',
      'ret',
    ]);
  });

  it('agrees with the interpreter’s rsp at every stack event of scale_sum', () => {
    // Depth below the entry rsp, which is STACK_TOP − 8 after the harness's
    // call pushed its return address.
    const entry = STACK_TOP - 8n;
    for (const [scale, sum] of [
      [scaleO0, sumO0],
      [scaleO2, sumO2],
    ] as const) {
      const { steps } = run([scale, sum], 'scale_sum', {
        args: [0x5000n, 4n, 2n],
        memory: [{ address: 0x5000n, bytes: int32Bytes([3, 5, 7, 9]) }],
      });
      const own = steps.filter(
        (s) =>
          s.function === 'scale_sum' &&
          /^(pushq|popq|call|leave|subq|addq|movq|ret)$/.test(
            s.text.split(' ')[0]!,
          ),
      );
      const events = stackEvents(scale);
      const depths = trackStack(events);
      let next = 0;
      for (const step of own) {
        const mnemonic = step.text.split(' ')[0]!;
        if (mnemonic === 'movq' && step.text !== 'movq %rsp, %rbp') continue;
        if (/^(subq|addq)$/.test(mnemonic) && !step.text.endsWith('%rsp'))
          continue;
        const depth = depths[next]!;
        if (mnemonic === 'call')
          expect(Number(entry - step.rspAtCall!)).toBe(depth);
        else if (mnemonic === 'ret')
          // ret pops the caller's return address: rsp ends 8 above entry.
          expect(Number(entry - step.registers.rsp)).toBe(depth - 8);
        else expect(Number(entry - step.registers.rsp)).toBe(depth);
        next += 1;
      }
      expect(next).toBe(events.length);
    }
  });

  it('allows a leaf function to skip alignment and refuses broken frames', () => {
    expect(trackStack(['sub 24', 'add 24', 'ret'])).toEqual([24, 0, 0]);
    expect(trackStack([])).toEqual([]);
    expect(() => trackStack(['call'])).toThrow(/not 16-byte aligned/);
    expect(() => trackStack(['push', 'push', 'call'])).toThrow(RangeError);
    expect(() => trackStack(['pop'])).toThrow(/above its entry/);
    expect(() => trackStack(['sub 8', 'add 16'])).toThrow(RangeError);
    expect(() => trackStack(['push', 'ret'])).toThrow(/not popped/);
    expect(() => trackStack(['push', 'leave'])).toThrow(/without a frame/);
    expect(() => trackStack(['ret', 'push'])).toThrow(/after ret/);
    for (const event of ['sub -8', 'add 2.5', 'sub', 'jump'])
      expect(() => trackStack([event])).toThrow(RangeError);
  });

  it('gives the practice answer: sub 8 after two pushes aligns the call', () => {
    expect(
      trackStack([
        'push',
        'push',
        'sub 8',
        'call',
        'add 8',
        'pop',
        'pop',
        'ret',
      ]),
    ).toEqual([8, 16, 24, 24, 16, 8, 0, 0]);
    expect(() => trackStack(['push', 'push', 'call'])).toThrow(RangeError);
  });

  it('counts how many equal frames fit in a stack', () => {
    expect(maxDepth(48, 8 * 1024 * 1024)).toBe(174_762);
    expect(maxDepth(8, 64)).toBe(8);
    expect(maxDepth(64, 1024 * 1024)).toBe(16_384);
    expect(maxDepth(100, 99)).toBe(0);
    for (const bad of [0, -8, 1.5, Number.NaN])
      expect(() => maxDepth(bad, 64)).toThrow(RangeError);
  });
});

it('checks the exact output displayed by the lesson', () => {
  expect(
    framesExample({
      sumO0: text('sum-O0.txt'),
      scaleO0: text('scale-O0.txt'),
      scaleO2: text('scale-O2.txt'),
    }),
  ).toBe(
    'scale_sum -O0: push → 8, frame → 8, sub 16 → 24, call → 24, leave → 0, ret → 0\n' +
      'scale_sum -O2: push → 8, call → 8, pop → 0, ret → 0\n' +
      'sum_to -O0: push → 8, frame → 8, pop → 0, ret → 0',
  );
});
