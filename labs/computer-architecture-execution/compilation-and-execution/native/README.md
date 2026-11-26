# Native lab

The subject's C programs, their compiler artifacts and its measurements. The
recorded target is Linux x86-64 with the System V ABI, compiled by GCC 15.2.0
and binutils 2.46 (`toolchain.json`). `verify-native.mjs` registers them with
the shared native runner (`scripts/native.ts`,
[ADR 0010](../../../../docs/adr/0010-shared-native-runner.md)), which the
Operating Systems & Runtime Internals lab uses too.

## Set up a compiler

Any GCC-compatible compiler runs the programs and their assertions. The drift
check below compares listings only when the compiler and binutils report the
recorded versions. To reproduce them without root access, extract the Ubuntu
26.04 packages into a folder:

```sh
sh scripts/setup-gcc-ubuntu.sh /tmp/anvaya-cc
```

On another Ubuntu release, prefix the command with
`ANVAYA_UBUNTU_SUITE=resolute`, which downloads the 26.04 packages through a
private package list. The folder holds the compiler wrapper and, in `bin/`,
the binutils it assembles and links with; set `ANVAYA_BINUTILS=/tmp/anvaya-cc/bin`
so the runner disassembles with the same `objdump` and `nm`. `lscpu` is used
when present.

The ARM64 listings come from GCC 15.2 targeting aarch64-linux-gnu, used only
for `-S` output. Recreate it the same way and select it with `ANVAYA_CC_ARM64`;
without it the ARM64 comparison is reported as skipped:

```sh
sh scripts/setup-gcc-arm64-ubuntu.sh /tmp/anvaya-cc-arm64
```

Browser tests need Chromium's shared libraries; on a minimal Ubuntu, extract
them with `sh scripts/setup-browser-deps.sh /tmp/anvaya-browser-deps`.

## Run

From the repository root:

```sh
ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_BINUTILS=/tmp/anvaya-cc/bin \
  node labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs
```

The runner works in a temporary folder that it always removes. It:

1. compiles and runs every checked program at each listed optimization level,
   so their assertions execute;
2. regenerates each artifact listed in `ARTIFACTS` (function listings, undefined
   object symbols, program output) and compares it with the committed file,
   failing on any difference;
3. runs each measurement in `MEASUREMENTS`, validates its checksums, and
   reports the compiler, CPU and `lscpu --caches` output beside the timings.

Its JSON report names every tool as present or absent, and every artifact as
`same`, `changed` or `skipped` with the reason. `ANVAYA_CC=… pnpm test` runs
the same script through `native.test.ts`; without the variable that test is
skipped. Add `--record` to rewrite the artifacts and `toolchain.json`
deliberately, or `--record-measurements [--only <text>]` to rerun the
measurements in full and rewrite their files, then review the change and the
lessons that display them. Timings have no passing threshold.

## Files

`program.c` checks that `bump` returns and stores 8. `bump-O0.txt` and
`bump-O2.txt` are the compiler's complete function listings, including
directives; they are display artifacts, not handwritten assembly.
`object-symbols.txt` is `nm -u` of the `-O2` object. The locality benchmark and
its recorded observations live beside the performance lab; hardware counters
and CPU affinity are not controlled.
