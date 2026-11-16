# Independent practice

Implement `solve` in `starter.ts` before opening `relocation.ts`: return the
four little-endian bytes of the signed 32-bit value S + A − P, the patch an
x86-64 linker writes for a PC-relative relocation, and throw a `RangeError` when
the value does not fit.

Run `pnpm lab computer-architecture-execution/compilation-and-execution`. The
attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. For each case, check your answer by
adding the displacement to the address of the next instruction.

`relocation.test.ts` reads the recorded object file and executable in
`native/` and checks that this formula reproduces the bytes the real linker
wrote. `example.ts` is a separate teaching linker with absolute word addresses.
