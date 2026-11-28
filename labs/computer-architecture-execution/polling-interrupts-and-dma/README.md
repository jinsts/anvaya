# Independent practice

Implement `solve` in `starter.ts` before opening `notification.ts`: poll a device
every `interval` time units, starting at time `interval`, until every
completion has been found. A poll at time t finds every completion ready at or
before t that is not yet found. Return `{ checks, emptyChecks, delays }`: the
polls made, the polls that found nothing new, and for each completion in input
order the time it was found minus its ready time. With no completions, nothing
is polled. Throw a `RangeError` for an interval that is not positive and finite,
or a ready time that is negative or not finite. For example, one completion
ready at 10, polled every 4, is found at 12 after three checks, two of them
empty, with a delay of 2.

Run `pnpm lab computer-architecture-execution/polling-interrupts-and-dma`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, say which poll found each
completion and why the empty checks still cost CPU time.

`notification.ts` also models per-completion and coalesced interrupts and the
PIO and DMA transfer timelines the lesson draws, in illustrative units.
