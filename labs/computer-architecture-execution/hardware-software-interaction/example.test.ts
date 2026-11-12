import { describe, expect, it } from 'vitest';
import {
  enterKernel,
  privilegeExample,
  returnToUser,
  type CpuState,
} from './example';

describe('privilege transition model', () => {
  const user: CpuState = { mode: 'user', pc: 12, resumePc: null };

  it('checks the displayed example exactly', () => {
    expect(privilegeExample()).toBe(
      'syscall resumes at 13\nfault retries 12\ninterrupt resumes at 12',
    );
  });

  it.each(['interrupt', 'fault'] as const)(
    'saves the current instruction index for %s without mutating input',
    (event) => {
      expect(enterKernel(user, event, 100)).toEqual({
        mode: 'kernel',
        pc: 100,
        resumePc: 12,
      });
      expect(user).toEqual({ mode: 'user', pc: 12, resumePc: null });
    },
  );

  it('supports instruction zero and rejects nested entry or missing context', () => {
    const zero: CpuState = { mode: 'user', pc: 0, resumePc: null };
    expect(returnToUser(enterKernel(zero, 'fault', 0))).toEqual(zero);
    expect(() =>
      enterKernel(enterKernel(user, 'syscall', 100), 'fault', 200),
    ).toThrow();
    expect(() => returnToUser(user)).toThrow();
    expect(() =>
      enterKernel({ ...user, resumePc: 3 }, 'syscall', 100),
    ).toThrow();
  });

  it.each([-1, 0.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid instruction index %s',
    (pc) => {
      expect(() => enterKernel({ ...user, pc }, 'fault', 100)).toThrow(
        RangeError,
      );
      expect(() => enterKernel(user, 'interrupt', pc)).toThrow(RangeError);
    },
  );

  it('rejects an unrepresentable syscall return index', () => {
    expect(() =>
      enterKernel({ ...user, pc: Number.MAX_SAFE_INTEGER }, 'syscall', 100),
    ).toThrow(RangeError);
  });
});
