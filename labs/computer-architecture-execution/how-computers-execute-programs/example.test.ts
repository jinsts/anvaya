import { describe, expect, it } from 'vitest';
import { execute, executionExample } from './example';

describe('illustrative instruction execution', () => {
  it('checks every displayed snapshot through a taken and untaken branch', () => {
    expect(executionExample()).toBe(
      '0: 0\n1: 2\n2: 1\n1: 1\n2: 0\n3: 0\n3: 0 halted',
    );
  });

  it('wraps unsigned addition and leaves the caller program unchanged', () => {
    const program = [
      { op: 'set', value: 255 },
      { op: 'add', value: 1 },
      { op: 'halt' },
    ] as const;
    expect(execute(program).at(-1)).toEqual({
      pc: 2,
      accumulator: 0,
      halted: true,
    });
    expect(program[0]).toEqual({ op: 'set', value: 255 });
  });

  it('supports an immediate halt and counts halt toward the step budget', () => {
    expect(execute([{ op: 'halt' }], 1)).toEqual([
      { pc: 0, accumulator: 0, halted: false },
      { pc: 0, accumulator: 0, halted: true },
    ]);
  });

  it('rejects invalid programs and budgets', () => {
    expect(() => execute([])).toThrow('empty');
    for (const value of [-1, 256, 1.5, NaN, Infinity]) {
      expect(() => execute([{ op: 'set', value }])).toThrow('unsigned bytes');
    }
    for (const target of [-1, 1, 0.5, NaN]) {
      expect(() => execute([{ op: 'jnz', target }])).toThrow('Branch target');
    }
    for (const budget of [0, -1, 1.5, Infinity]) {
      expect(() => execute([{ op: 'halt' }], budget)).toThrow('maxSteps');
    }
  });

  it('bounds infinite execution and diagnoses a missing halt', () => {
    expect(() =>
      execute(
        [
          { op: 'set', value: 1 },
          { op: 'jnz', target: 1 },
        ],
        5,
      ),
    ).toThrow('Step limit');
    expect(() => execute([{ op: 'set', value: 1 }])).toThrow('fell outside');
  });
});
