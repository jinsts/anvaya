# Independent practice

Implement `solve` in `starter.ts` before opening `example.ts`: count the
instructions executed by the teaching program set `initial`, add 255, branch
back to the add while the accumulator is nonzero, halt. Count every executed
instruction, including the untaken branch and the halt, and throw a
`RangeError` when `initial` is not an unsigned byte, a whole number from 0
through 255. For example, starting at 2 executes six instructions: one set, two
additions, two branches and the halt.

Run `pnpm lab computer-architecture-execution/how-computers-execute-programs`.
The attempt throws until you implement it; the ordinary quality gate checks the
reference against the same contracts. Explain the state invariant (the
accumulator stays a byte, and the program counter always names an instruction)
as well as returning the expected counts.

`datapath.ts` is the separate register machine behind the lesson's datapath
stepper; `datapath.test.ts` checks the output the lesson shows.
