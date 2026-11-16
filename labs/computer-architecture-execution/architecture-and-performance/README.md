# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: compare two runs
by CPU time, each described by instruction count, average cycles per
instruction and clock frequency.

Run `pnpm lab computer-architecture-execution/architecture-and-performance`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference model against the same contracts. For each case, say which term of
the CPU-time equation made the difference.

`locality.c` is the recorded measurement. The native lab rebuilds it at
`-O2 -fno-loop-interchange`; rerun it with `--record-measurements --only
architecture-and-performance`. The model estimates; it measures nothing.
