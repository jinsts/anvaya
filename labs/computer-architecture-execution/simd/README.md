# Independent practice

Implement `solve` in `starter.ts` before opening `lanes.ts`: compute a binary32
sum in the order GCC's reassociated four-lane loop uses, rounding every addition
with `Math.fround`.

Run `pnpm lab computer-architecture-execution/simd`. The attempt throws until
you implement it; the ordinary quality gate checks the reference against the
same contracts. For each case, compare your answer with the sum in source order.

`simd.c` is compiled by the native lab, which runs `main.c`'s checks at `-O2`
and `-O3`, and regenerates the listings and GCC's vectorization reports
(`report-*.txt`), failing if they drift.
