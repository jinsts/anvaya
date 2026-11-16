# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: return the UTF-8
bytes of one code point using RFC 3629's byte templates, shifts and masks,
without `TextEncoder`. Reject surrogates and values above U+10FFFF with a
`RangeError`.

Run `pnpm lab computer-architecture-execution/text-encoding-and-memory-layout`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, name the template row the
code point selects and which of its bits land in each byte.

`representation.c` prints this target's byte order, a UTF-8 literal and two
record layouts. The native lab compiles it and compares its output with
`representation-output.txt`; `example.test.ts` checks the models against that
recorded output.
