# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: return `'hit'` or
`'miss'` for each read, in order, through a cold cache of 16-byte lines with
`sets` sets of `ways` lines each and exact LRU replacement within a set. Block
⌊address ÷ 16⌋ can live only in set block mod `sets`. A miss fills an empty way
first and otherwise evicts the way used longest ago, and a hit counts as a use.
For example, reads of 0, 16, 0 in one set of two ways give miss, miss, hit.

Run `pnpm lab computer-architecture-execution/cache-organization`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. Explain which set each address uses and which line
LRU evicts, as well as returning the decisions.

`lscpu-caches.txt` is the recording machine's `lscpu --caches` output, which the
lesson displays; `lscpu.test.ts` checks that each recorded set count follows
from size, ways and line size.
