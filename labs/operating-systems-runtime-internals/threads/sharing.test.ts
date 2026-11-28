import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RESOURCES, sharing, threadsExample } from './sharing';

const recorded = readFileSync(
  'labs/operating-systems-runtime-internals/threads/share-output.txt',
  'utf8',
);

describe('what a thread shares and a child copies', () => {
  it('agrees with what share.c recorded on Linux', () => {
    // The independent check: the real thread and child behaved this way.
    expect(sharing('process ID', 'thread')).toBe('shared');
    expect(recorded).toContain(
      "thread T: process ID same as main's, thread ID different",
    );
    expect(sharing('thread ID', 'thread')).toBe('separate');
    expect(sharing('process ID', 'fork')).toBe('separate');
    expect(recorded).toContain('child: process ID different');
    expect(sharing('globals and heap', 'thread')).toBe('shared');
    expect(recorded).toContain('T set counter to 42; main reads 42');
    expect(sharing('globals and heap', 'fork')).toBe('copied');
    expect(recorded).toContain('after the child: main reads counter 42');
    expect(sharing('file descriptors', 'thread')).toBe('shared');
    expect(recorded).toMatch(/T opened descriptor \d+; main writes to it: ok/);
    expect(sharing('file descriptors', 'fork')).toBe('copied');
    expect(recorded).toMatch(/it still has descriptor \d+: yes/);
    expect(recorded).toMatch(/descriptor \d+ in main: not open/);
  });

  it('records that fork copies only the calling thread', () => {
    expect(recorded).toContain('Threads 2\n');
    expect(recorded).toMatch(/child: .*; Threads 1/);
    expect(recorded).toContain('after T exits: Threads 1');
  });

  it('classifies every resource for both relations and names its source', () => {
    for (const row of RESOURCES) {
      expect(['shared', 'copied', 'separate']).toContain(row.thread);
      expect(['shared', 'copied', 'separate']).toContain(row.fork);
      expect(row.source).toMatch(/\(\d\)/);
    }
    // Nothing a thread shares is shared with a forked child.
    expect(RESOURCES.filter((r) => r.fork === 'shared')).toEqual([]);
    expect(new Set(RESOURCES.map((r) => r.name)).size).toBe(RESOURCES.length);
  });

  it('answers the lesson’s practice prediction', () => {
    expect(sharing('registers', 'thread')).toBe('separate');
    expect(sharing('registers', 'fork')).toBe('copied');
  });

  it('refuses unknown resources and relations', () => {
    expect(() => sharing('heap memory', 'thread')).toThrow(
      new RangeError('Unknown resource heap memory'),
    );
    expect(() => sharing('stack', 'vfork' as 'fork')).toThrow(RangeError);
  });
});

it('prints the lesson output', () => {
  expect(threadsExample()).toBe(
    [
      'new thread: shared globals and heap, file descriptors, process ID, signal dispositions, current directory, CPU time used; copied signal mask; separate stack, registers, errno, thread ID, pending signals',
      'forked child: shared nothing; copied globals and heap, stack, registers, errno, file descriptors, signal dispositions, signal mask, current directory; separate process ID, thread ID, pending signals, CPU time used',
    ].join('\n'),
  );
});
