# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: read an 8-bit
pattern, given as its unsigned value, as a two's complement integer, and throw
a `RangeError` for anything that is not a whole number from 0 through 255. For
example, 255 is `11111111`; its top bit weighs −128, so it reads as
255 − 256 = −1.

Run `pnpm lab computer-architecture-execution/binary-and-data-representation`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, explain which weight the
top bit carries and why a value outside 0–255 is refused rather than wrapped,
as well as returning the expected values.
