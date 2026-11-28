# Independent practice

Implement `solve` in `starter.ts` before opening `stats.ts`: summarize a list of
repeated timings as `{ median, p90 }` without changing the list. The median of
an even count is the mean of the two middle values. `p90` is the nearest-rank
90th percentile: the value at 1-based rank ⌈0.9 × n⌉ in sorted order. Throw a
`RangeError` for an empty list or a non-finite value. For example, `[4, 2, 8]`
sorts to 2, 4, 8: the median is 4, and rank ⌈2.7⌉ = 3 makes p90 8.

Run `pnpm lab computer-architecture-execution/measuring-performance`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference in `stats.ts` against the same contracts. Before opening the
reference, explain why p90 is the slowest run whenever there are fewer than
ten runs.

## Recorded artifacts

`timing.c` sums a 4 MiB array many times, alternating a warm run with a cold
run after a 64 MiB sweep, and checks every sum. The native lab
(`../compilation-and-execution/native/verify-native.mjs`) compiles it with
`-std=c17 -O2`, validates the checksums and, with `--record-measurements`,
writes `timing.json`: the date, compiler, target, CPU, `lscpu --caches`, flags,
sizes and every run. `stats.test.ts` asserts only the relationships the lesson
states about that recording; timings have no pass thresholds.

`perf-counters.sh` is owner-run: it counts hardware events with `perf stat` on
native Linux, and exits with status 2 and a message when `perf` is missing,
which a test checks. Nothing it measures appears in the lesson until the owner
records and reviews its output.
