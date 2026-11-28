import { expect, it } from 'vitest';
// solve(resource, relation) says how a resource relates between a creator
// and what it creates on Linux with POSIX threads: relation 'thread' (a new
// thread and the thread that created it) or 'fork' (a child and its parent).
// Return 'shared' (one object both use), 'copied' (each has its own, starting
// as a copy) or 'separate' (each has its own that was not inherited: new,
// empty or zero). The resources are those in README.md. Throw a RangeError
// for any other resource or relation.
type Sharing = 'shared' | 'copied' | 'separate';
export function contracts(
  solve: (resource: string, relation: 'thread' | 'fork') => Sharing,
) {
  it('unseen case 1', () =>
    expect(solve('signal mask', 'thread')).toBe('copied'));
  it('unseen case 2', () =>
    expect(solve('signal dispositions', 'thread')).toBe('shared'));
  it('unseen case 3', () =>
    expect(solve('signal dispositions', 'fork')).toBe('copied'));
  it('unseen case 4', () =>
    expect(solve('current directory', 'thread')).toBe('shared'));
  it('unseen case 5', () =>
    expect(solve('CPU time used', 'fork')).toBe('separate'));
  it('unseen case 6', () =>
    expect(solve('pending signals', 'fork')).toBe('separate'));
  it('unseen case 7', () => expect(solve('errno', 'thread')).toBe('separate'));
  it('unseen case 8', () =>
    expect(() => solve('user ID', 'thread')).toThrow(RangeError));
  it('unseen case 9', () =>
    expect(() => solve('errno', 'vfork' as 'fork')).toThrow(RangeError));
}
