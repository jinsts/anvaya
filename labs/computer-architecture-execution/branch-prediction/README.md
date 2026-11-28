# Independent practice

Implement `solve` in `starter.ts` before opening `predictor.ts`: count how many
of a branch's outcomes a two-bit saturating counter mispredicts, starting in
state 1. Throw a `RangeError` for an outcome that is not `true` or `false`.

Run `pnpm lab computer-architecture-execution/branch-prediction`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. For each case, write the state before each branch.

`kernel.c` and `harness.c` are the sorted-versus-random experiment. The native
lab builds the kernel three ways, drift-checks each listing (`kernel-*.txt`),
and records `sorted-random.json` only with
`--record-measurements --only sorted-random`.
