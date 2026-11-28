# Independent practice

Implement `solve` in `starter.ts` before opening `x86.ts`: given a conditional
jump and the two 32-bit operands of the `cmpl` before it, return whether the
jump is taken. Compute ZF, SF, CF and OF from the 32-bit subtraction
left − right, then apply the jump's condition; comparing the numbers directly
skips the point of the exercise. Throw a `RangeError` for an unknown jump or an
operand outside −2³¹ to 2³¹ − 1.

Run `pnpm lab computer-architecture-execution/reading-assembly`. The attempt
throws until you implement it; the ordinary quality gate checks the reference,
which runs the same comparison through the interpreter, against the same
contracts. For each case, say which flags decided it.

`sum.c`, `scale.c` and `main.c` are compiled and checked by the native lab,
which also regenerates the committed listings (`sum-O0.txt` and the others) and
fails if they drift. The `*-arm64-O2.txt` listings come from GCC 15.2 targeting
aarch64-linux-gnu; set `ANVAYA_CC_ARM64` to check them too.
