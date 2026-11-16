# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: return the user
instruction index that runs after the kernel handles a system call, a
restartable fault or an interrupt.

Run `pnpm lab computer-architecture-execution/hardware-software-interaction`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference model against the same contracts. For each case, say whether the
instruction at `pc` has completed when the kernel is entered.

The model counts instructions, not bytes, and is not an ISA emulator: real
instructions have different lengths, and some faults cannot be restarted.
