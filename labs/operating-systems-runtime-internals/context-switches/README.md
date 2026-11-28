# Independent practice

Implement `solve(batches)` in `starter.ts` before opening `switches.ts`.
Each batch is `{ pingPongNs, pipeNs }`: the nanoseconds per round trip when
two tasks on one CPU pass a byte back and forth through two pipes, and the
nanoseconds per round trip when one process does the same pipe work without
switching. A round trip makes two context switches, so a batch's estimate of
one switch is `(pingPongNs − pipeNs) / 2`.

Return `{ median, p90 }` of the batches' estimates, with the convention of
the measuring-performance lab: the median of an even count is the mean of the
two middle values, and p90 is the value at 1-based rank `ceil(0.9 × n)` in
sorted order. Do not change the input. Throw a `RangeError` for no batches,
a timing that is not a finite number, a pipe time that is not positive, or a
ping-pong time that is not greater than its pipe time.

Run `pnpm lab operating-systems-runtime-internals/context-switches`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts.

## Recorded evidence

`switch.c` follows the method OSTEP chapter 6 describes for lmbench. It pins
itself to one CPU and, in each of 15 batches, times 100,000 round trips of
three kinds in an order that rotates every batch: one process doing the pipe
work alone, a parent and a forked child, and two threads. For the two
ping-pong kinds it also reads the measuring thread's `voluntary_ctxt_switches`
and `nonvoluntary_ctxt_switches` from `/proc/thread-self/status`. The shared
native runner (`../native/registry.ts`) records `switch.json`;
`switches.test.ts` checks the model against it.
