# Independent practice

Implement `solve(tasks, quantum, duration)` in `starter.ts` before opening
`fair.ts`. It runs `tasks` on one CPU for `duration` milliseconds under a
weighted fair model of Linux's scheduler, and returns
`{ order, cpu }`: who ran, in order, with consecutive milliseconds of the same
task merged (`null` while nothing is runnable), and each task's milliseconds
of CPU.

A task is `{ name, nice?, run?, sleep? }`. `nice` runs from -20 to 19 and is
0 by default; its weight comes from the kernel's table in OSTEP chapter 9
(1024 at nice 0, 335 at nice 5). A task with `run` and `sleep` runs that many
milliseconds of CPU and then sleeps that many, over and over; a task without
them is always busy. Every task starts runnable at 0 ms with a virtual
runtime of 0.

Work one millisecond at a time:

1. Wake every task whose sleep ends now. Its virtual runtime becomes the
   larger of its own and the lowest virtual runtime among the tasks that are
   already runnable (if any).
2. Decide when time is 0, when the running task has used `quantum`
   milliseconds since it was picked, when the running task went to sleep in
   the previous millisecond, or when the CPU is idle and a task woke. Pick
   the runnable task with the lowest virtual runtime; on a tie, the one that
   ran longest ago (one that never ran first), then the one listed first. The
   running task competes too.
3. The picked task runs for the millisecond: its virtual runtime grows by
   `floor(1_000_000 × 1024 / weight)` nanoseconds. If it has now run its
   `run` milliseconds, it sleeps for `sleep` milliseconds starting with the
   next one.

Throw a `RangeError` for a nice value outside -20 to 19, a quantum,
duration, run or sleep that is not a positive integer, a task given only one
of `run` and `sleep`, or two tasks with the same name.

Run `pnpm lab operating-systems-runtime-internals/scheduling`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. Linux 6.6 and later run EEVDF, which also decides
when a task wakes; this model does not.

## Recorded evidence

`fair.c` pins every process it starts to one CPU. It runs two busy processes
at nice 0 and 0, then 0 and 5, and reads each one's CPU time from the
kernel's accounting; then it runs a process that sleeps until every 10 ms
mark, notes how late it woke, and works for 1 ms, without and with a busy
neighbour on the CPU. Raising one's own nice value and choosing a CPU need no
privileges. The shared native runner (`../native/registry.ts`) records
`fair.json`; `fair.test.ts` checks the model against it.
