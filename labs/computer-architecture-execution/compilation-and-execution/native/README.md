# Native lab

The subject's C programs, their compiler artifacts and its measurements. The
recorded target is Linux x86-64 with the System V ABI, compiled by GCC 15.2.0
(`toolchain.json`).

## Set up a compiler

Any GCC-compatible compiler runs the programs and their assertions. The drift
check below compares listings only when the compiler reports the recorded
version. To reproduce it without root access on Ubuntu 26.04, extract the
packages into a folder:

```sh
sh labs/computer-architecture-execution/compilation-and-execution/native/setup-gcc-ubuntu.sh /tmp/anvaya-cc
```

GNU `nm` (binutils) must be on the path, and `lscpu` is used when present.

## Run

From the repository root:

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler node labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs
```

The script works in a temporary folder that it always removes. It:

1. compiles and runs every checked program at each listed optimization level,
   so their assertions execute;
2. regenerates each artifact listed in `ARTIFACTS` (function listings, undefined
   object symbols, program output) and compares it with the committed file,
   failing on any difference;
3. runs each measurement in `MEASUREMENTS`, validates its checksums, and
   reports the compiler, CPU and `lscpu --caches` output beside the timings.

`ANVAYA_CC=… pnpm test` runs the same script through `native.test.ts`; without
the variable that test is skipped. Add `--record` to rewrite the artifacts,
the measurement files and `toolchain.json` deliberately, then review the
change and the lessons that display them. Timings have no passing threshold.

## Files

`program.c` checks that `bump` returns and stores 8. `bump-O0.txt` and
`bump-O2.txt` are the compiler's complete function listings, including
directives; they are display artifacts, not handwritten assembly.
`object-symbols.txt` is `nm -u` of the `-O2` object. The locality benchmark and
its recorded observations live beside the performance lab; hardware counters
and CPU affinity are not controlled.
