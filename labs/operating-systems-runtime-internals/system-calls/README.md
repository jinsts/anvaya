# Independent practice

Implement `solve(trace)` in `starter.ts` before opening `trace.ts`: summarize
the text that `strace -f -o file` writes, where every line starts with a
process ID. Return `{ calls, errors, bytesRead, bytesWritten }`:

- `calls`: per system-call name, the calls that returned, which is what
  `strace -c` counts. A call that never returned (`= ?`, such as
  `exit_group`) is not counted; a failed call (`= -1 ENOENT (…)`) counts as a
  call and as an error.
- `errors`: per name, the calls that returned an error.
- `bytesRead` and `bytesWritten`: the results of successful `read` and
  `pread64` calls, and of successful `write` and `pwrite64` calls.

A call that another thread interrupted in the trace, `name(… <unfinished
...>`, counts once, on its `<... name resumed>` line. Signal lines
(`--- … ---`), exit lines (`+++ … +++`) and blank lines are not calls. Throw a
`SyntaxError` whose message contains `line N` for any other line, and for a
resumed line whose process never started that call.

Run `pnpm lab operating-systems-runtime-internals/system-calls`. The attempt
throws until you implement it; the ordinary quality gate checks the reference
against the same contracts. Before reading the reference, explain for each
rule why `strace -c` would count that way.

## Recorded evidence

The lesson's traces come from `serve` (`../native/serve.c`) and two small
programs here, registered in `../native/registry.ts` and run by the shared
native runner with strace 6.19 and GCC 15.2:

- `numbers.txt`: the system-call numbers `numbers.c` prints from
  `<sys/syscall.h>`. Drift-checked.
- `serve-trace.txt` and `serve-missing-trace.txt`: serve's own calls, from
  its first `openat` to its exit, with and without its request file. Process
  IDs read P1. Drift-checked.
- `serve-strace.json`: serve's whole run under `strace -f -C`, with strace's
  own summary table, which `trace.test.ts` compares with the model call for
  call.
- `cost.json` and `cost-traced.json`: `cost.c` timing `getpid` against
  `clock_gettime` in fifteen alternated rounds, without and with strace.

Each recording names its date, tools, kernel, CPU, environment and command.
These were made on 2026-11-26 in a Claude Code cloud container (a Firecracker
microVM under KVM with 4 vCPUs, Ubuntu 24.04, as root), not on the owner's
WSL2 machine; timings there will differ. Regenerate them with
`node labs/operating-systems-runtime-internals/native/registry.ts
--record-measurements --only system-calls`, and the artifacts with
`--record`, only on purpose.
