/**
 * The threads lesson's model: what a new thread shares with the thread that
 * created it, and what a child made by fork gets from its parent.
 *
 * - shared: one object that both use; a change by either is seen by both.
 * - copied: each has its own, starting as a copy at creation; later changes
 *   are independent.
 * - separate: each has its own that was not inherited: new, empty or zero.
 *
 * The table follows Linux with glibc's POSIX threads: pthreads(7) for what
 * threads share and keep apart, pthread_create(3) for a new thread's signal
 * mask, fork(2) and signal(7) for what a child inherits. Linux makes both
 * with clone(2); the flags it passes decide what is shared.
 */

export type Relation = 'thread' | 'fork';
export type Sharing = 'shared' | 'copied' | 'separate';

export interface Resource {
  name: string;
  /** Where it lives, for the address-space figure. */
  kind: 'memory' | 'kernel' | 'per-thread';
  thread: Sharing;
  fork: Sharing;
  /** The manual page that says so. */
  source: string;
}

export const RESOURCES: readonly Resource[] = [
  {
    name: 'globals and heap',
    kind: 'memory',
    thread: 'shared',
    fork: 'copied',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'stack',
    kind: 'memory',
    thread: 'separate',
    fork: 'copied',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'registers',
    kind: 'per-thread',
    thread: 'separate',
    fork: 'copied',
    source: 'pthread_create(3), fork(2)',
  },
  {
    name: 'errno',
    kind: 'per-thread',
    thread: 'separate',
    fork: 'copied',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'file descriptors',
    kind: 'kernel',
    thread: 'shared',
    fork: 'copied',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'process ID',
    kind: 'kernel',
    thread: 'shared',
    fork: 'separate',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'thread ID',
    kind: 'per-thread',
    thread: 'separate',
    fork: 'separate',
    source: 'gettid(2)',
  },
  {
    name: 'signal dispositions',
    kind: 'kernel',
    thread: 'shared',
    fork: 'copied',
    source: 'pthreads(7), signal(7)',
  },
  {
    name: 'signal mask',
    kind: 'per-thread',
    thread: 'copied',
    fork: 'copied',
    source: 'pthread_create(3), signal(7)',
  },
  {
    name: 'pending signals',
    kind: 'per-thread',
    thread: 'separate',
    fork: 'separate',
    source: 'pthread_create(3), fork(2)',
  },
  {
    name: 'current directory',
    kind: 'kernel',
    thread: 'shared',
    fork: 'copied',
    source: 'pthreads(7), fork(2)',
  },
  {
    name: 'CPU time used',
    kind: 'kernel',
    thread: 'shared',
    fork: 'separate',
    source: 'pthreads(7), fork(2)',
  },
];

/** How a resource relates between a creator and what it creates. */
export function sharing(resource: string, relation: Relation): Sharing {
  if (relation !== 'thread' && relation !== 'fork')
    throw new RangeError(
      `Unknown relation ${String(relation)}: use thread or fork`,
    );
  const row = RESOURCES.find((r) => r.name === resource);
  if (!row) throw new RangeError(`Unknown resource ${resource}`);
  return row[relation];
}

/** The lesson's verified output: each relation's resources, grouped. */
export function threadsExample(): string {
  return (['thread', 'fork'] as const)
    .map((relation) => {
      const of = (kind: Sharing) =>
        RESOURCES.filter((r) => r[relation] === kind).map((r) => r.name);
      return `${relation === 'thread' ? 'new thread' : 'forked child'}: shared ${of('shared').join(', ') || 'nothing'}; copied ${of('copied').join(', ') || 'nothing'}; separate ${of('separate').join(', ')}`;
    })
    .join('\n');
}
