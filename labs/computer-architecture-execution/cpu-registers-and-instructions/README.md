# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: split a 16-bit
teaching instruction into its opcode, register and immediate fields with shifts
and masks, and reject reserved opcodes and out-of-range words with a
`RangeError`.

Run `pnpm lab computer-architecture-execution/cpu-registers-and-instructions`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference decoder against the same contracts. For each case, name the bits
that hold each field.

`bump.test.ts` runs GCC's real `bump` listing in the reading-assembly lab's
interpreter to back the lesson's transfer task.
