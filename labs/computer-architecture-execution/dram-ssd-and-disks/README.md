# Independent practice

Implement `solve` in `starter.ts` before opening `devices.ts`: return the
expected time of one random disk read as average seek plus half a revolution
plus the transfer, and reject impossible drive parameters.

Run `pnpm lab computer-architecture-execution/dram-ssd-and-disks`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. For each case, say which term dominates.

`sweep.c` is the working-set sweep. The native lab compiles it, runs it in quick
mode to check that every chase ends at the same node in every repetition, and
records `sweep.json` only with `--record-measurements --only sweep`. `sweep.ts`
summarizes that recording for the lesson.
