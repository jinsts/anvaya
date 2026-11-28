# Independent practice

Implement `solve` in `starter.ts` before opening `pipeline.ts`: count the
bubbles the five-stage teaching pipeline inserts into straight-line code, with
or without forwarding. The model's assumptions are listed at the top of
`pipeline.ts`. Throw a `RangeError` for an unknown instruction kind.

Run `pnpm lab computer-architecture-execution/pipelining-and-hazards`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, name the producer each
waiting instruction depends on.
