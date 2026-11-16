# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: run a DMA receive
buffer through submit, complete, fail and reclaim events and report who owns it
afterwards.

Run `pnpm lab computer-architecture-execution/io-mechanisms`. The attempt throws
until you implement it; the ordinary quality gate checks the reference model
against the same contracts. For each case, say which events the protocol
refuses and why.

The model accesses no device. `pollingDetection` and `interruptDetection`
compute the lesson's illustrative timeline; their units are not measurements.
