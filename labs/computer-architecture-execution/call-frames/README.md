# Independent practice

Implement `solve` in `starter.ts` before opening `stackPointer.ts`: track one
x86-64 function's stack pointer as its depth, the bytes below rsp's value at
entry, and return the depth after each event. `push` and `pop` move 8 bytes,
`sub N` and `add N` move N bytes, `frame` (movq %rsp, %rbp) remembers the
depth, and `leave` returns to it and pops the saved rbp. A `call` needs rsp
16-byte aligned: at entry rsp is 8 bytes past a multiple of 16, because the
caller's call pushed the return address, so at depth d the call is aligned
when d − 8 is a multiple of 16. A `ret` needs every pushed byte popped again.
Throw a `RangeError` for a misaligned call, rsp above its entry value, a `ret`
with bytes still pushed, a `leave` without a frame, an event after `ret`, or an
unknown or malformed event. For example, GCC's -O2 `scale_sum` gives push → 8,
call → 8, pop → 0, ret → 0.

Run `pnpm lab computer-architecture-execution/call-frames`. The attempt throws
until you implement it; the ordinary quality gate checks the reference against
the same contracts. For each case, say what the pushed bytes hold and why the
call is or is not aligned.

`stackPointer.test.ts` also runs the reading-assembly lab's interpreter on
GCC's `scale_sum` listings and checks the model's depth against the
interpreter's rsp at every stack instruction. `frames.ts` reads the real -O0
frames for the lesson's frame figure from the same interpreter.
