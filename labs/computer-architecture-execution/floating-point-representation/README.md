# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: return the
number that a binary32 bit pattern stores, computed from its sign, exponent and
fraction fields. Do not use `DataView` or typed arrays; the reference does, so
your arithmetic is checked against an independent decoder.

Run `pnpm lab computer-architecture-execution/floating-point-representation`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, say which exponent rule
applies: normal, subnormal or zero, or the all-ones exponent.
