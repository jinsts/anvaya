# Independent practice

Implement `solve` in `starter.ts` before opening `accessTime.ts`: return the
average time of one access, in nanoseconds, through a list of cache levels and
then memory. Each level is `{ hitNs, missRate }`, nearest the core first. Every
access that reaches a level pays its `hitNs`, and its `missRate` is the
fraction of those accesses that miss and go on to the next level; memory
answers whatever misses the last level. Reject a miss rate outside 0–1 and a
negative or non-finite time with a `RangeError`. For example, one level with a
1 ns hit time and a 10% miss rate in front of 50 ns memory averages
1 + 0.1 × 50 = 6 ns.

Run `pnpm lab computer-architecture-execution/access-time-and-translation`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. Before opening the reference, explain
for each case why a level's miss rate multiplies every term after it, and what
fraction of all accesses reaches memory.

Every parameter here is illustrative. The model has no overlap, prefetching or
misses in flight together, so its averages are not predictions of elapsed time.
