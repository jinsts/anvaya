# Independent practice

Implement `solve` in `starter.ts` before opening `trace.ts`: run a list of call,
allocate, return, free and clear events and report which heap objects are still
allocated and which locals in active frames hold a handle to a freed object.

Run `pnpm lab computer-architecture-execution/stack-and-heap`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. For each case, say which event ended each object's
lifetime and which frames still named it.

`example.ts` is the byte-accounting model, `trace.ts` adds named locals and
handles for the stepper, and `frames.ts` reads GCC's real `-O0` frames from the
reading-assembly interpreter.
