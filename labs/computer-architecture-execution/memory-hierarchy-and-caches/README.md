# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: return `'hit'` or
`'miss'` for each byte address, in order, through a cold direct-mapped cache
with two 16-byte lines, and throw a `RangeError` for an address that is not a
nonnegative safe integer. An address belongs to block ⌊address ÷ 16⌋, and the
block number modulo 2 picks the only slot that can hold it. For example, 0, 4,
8, 12, 32, 0 gives miss, hit, hit, hit, miss, miss: blocks 0 and 2 share slot 0.

Run `pnpm lab computer-architecture-execution/memory-hierarchy-and-caches`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. Say which misses are cold and which are
conflicts as well as returning the decisions.

`traversal.ts` lists the line each element of a row-major matrix occupies, for
the lesson's traversal figure; `traversal.test.ts` checks it.
