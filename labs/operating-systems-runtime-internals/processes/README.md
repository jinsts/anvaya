# Independent practice

Implement `solve(program)` in `starter.ts` before opening `process.ts`: run a
small program of process actions and say how every process it creates ends.
A program is a list of actions that its first process, P1, runs in order:

- `{ fork: [...] }` creates a child that runs the listed actions and then
  exits with status 0, like `if (fork() == 0) { ...; _exit(0); }`.
- `{ exec: 'name', exits: n }` replaces the process's program with one that
  exits with status `n`, so nothing after it runs. Without `exits` the program
  does not exist: the exec fails and the process carries on.
- `{ wait: true }` reaps the process's oldest child that is not yet reaped,
  blocking until it exits; with no such child it returns at once.
- `{ exit: n }` ends the process with status `n`; `{ pause: true }` blocks
  forever.

Return every process, P1 first, as `{ name, parent, image, status, end }`.
Children are named P2, P3 … in the order their fork actions appear, reading a
fork's own actions before what follows it and counting only forks that run.
`image` is `'program'` or the name a successful exec gave it; `status` is the
exit status, or `null` for a process that never exits. `end` is `'reaped by
parent'` (P1 counts as reaped by the shell once it exits), `'reaped by init'`
(its parent exited first), `'zombie'` (it exited, and its parent runs on
without waiting for it) or `'running'`. Throw a `RangeError` for a status
outside 0–255 and a `TypeError` for anything that is not an action.

Run `pnpm lab operating-systems-runtime-internals/processes`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. Before reading the reference, explain why the
result does not depend on which process runs first after a fork.

## Recorded evidence

`launcher.c` runs the model's `LAUNCHER` program on Linux: it forks a child
that execs `serve`, a child whose exec fails, and a child that forks a
grandchild and exits. It catches its second child as a zombie in
`/proc/<pid>/stat` before reaping it, and makes itself a child subreaper
(`PR_SET_CHILD_SUBREAPER`) so that the orphaned grandchild comes to it rather
than to init. It prints the names P1 to P5, never process IDs, so
`launcher-output.txt` is the same on every run. The shared native runner
(`../native/registry.ts`) builds it and `serve` with GCC 15.2, runs it in a
folder holding `serve` and `request.txt`, and fails if the output drifts.
