# Independent practice

Implement `solve` in `starter.ts` before opening `models.ts`: run MESI for one
cache line shared by two cores and return both cores' states after each access.
Throw a `RangeError` for any token other than `A` or `B` followed by `r` or `w`.

Run `pnpm lab computer-architecture-execution/multicore`. The attempt throws
until you implement it; the ordinary quality gate checks the reference model
against the same contracts. For each case, say which accesses send a message
to the other cache.

The native lab builds `atomics.c` with `atomics_main.c` and real threads at
`-O0` and `-O2`, records each function's x86-64 and AArch64 listing, and fails
if a listing drifts. `false_sharing.c` is the recorded measurement; rerun it
with `--record-measurements --only multicore`.
