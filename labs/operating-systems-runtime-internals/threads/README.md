# Independent practice

Implement `solve(resource, relation)` in `starter.ts` before opening
`sharing.ts`: say how a resource relates between a creator and what it
creates, on Linux with POSIX threads. `relation` is `'thread'` (a new thread
and the thread that created it) or `'fork'` (a child and its parent). Return:

- `'shared'`: one object that both use; a change by either is seen by both;
- `'copied'`: each has its own, starting as a copy at creation;
- `'separate'`: each has its own that was not inherited, being new, empty or
  zero.

The resources are: globals and heap, stack, registers, errno, file
descriptors, process ID, thread ID, signal dispositions, signal mask, pending
signals, current directory and CPU time used. Throw a `RangeError` for any
other resource or relation.

Run `pnpm lab operating-systems-runtime-internals/threads`. The attempt throws
until you implement it; the ordinary quality gate checks the reference
against the same contracts. Reason from the manual pages rather than memory:
pthreads(7) lists what threads share and what each has, pthread_create(3)
says what a new thread inherits, and fork(2) and signal(7) say what a child
gets. For each answer, name the sentence that settles it.

## Recorded evidence

`share.c` starts a second thread and, while that thread is still running,
forks a child. Each reads `/proc/thread-self/status` and tries a global
variable and a file descriptor, and the program prints comparisons and
counts rather than IDs, so `share-output.txt` is the same on every run. The
shared native runner (`../native/registry.ts`) builds it with GCC 15.2 and
`-pthread` and fails if the output drifts.
