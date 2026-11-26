# 0010 — Shared native runner

Date: 2026-11-26. Status: proposed; implemented locally for owner review.

## Context

Computer Architecture & Execution records compiler listings, symbol tables,
program output and measurements, and checks them for drift with
`labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs`.
That script mixed the subject's registry of programs with the machinery that
builds them, and knew only one compiler. The approved Operating Systems &
Runtime Internals proposal adds system-call traces (strace 6.19), JVM
listings and runs (OpenJDK 21), Go escape analysis and runs (Go 1.26), and
container runs (Docker). The owner decided on 2026-11-25 to extract one
shared runner that both subjects use, as a platform change before the
subject's first lesson. Two more facts shaped it:

- The recorded artifacts must stay byte-identical: the architecture drift
  check compares 28 files.
- The recordings may be reproduced on hosts other than the owner's Ubuntu
  26.04. On Ubuntu 24.04, GCC 15.2 from 26.04 still assembled and linked with
  the host's binutils 2.42, because Ubuntu's GCC runs
  `/usr/bin/x86_64-linux-gnu-as` and `-ld` by absolute path, ahead of `PATH`
  and `-B`. The linked disassembly then differed in its alignment padding.

## Options

1. **Copy the script** into the new subject. Two runners would drift apart,
   and each new toolchain would be added twice.
2. **One shared runner and a registry per subject.** The runner detects tools,
   generates each kind of artifact, compares, records and reports; a subject
   lists its programs, artifacts and measurements as data.
3. **Containers for every toolchain.** Reproducible images, but Docker becomes
   a requirement for every native check, and pinned images still need a
   registry to pull from.

## Decision

Adopt option 2.

- `scripts/native.ts` is the runner. It finds each tool only from its
  variable: `ANVAYA_CC` (with `ANVAYA_BINUTILS` for `objdump` and `nm`),
  `ANVAYA_CC_ARM64`, `ANVAYA_STRACE`, `ANVAYA_JAVA_HOME`, `ANVAYA_GO` and
  `ANVAYA_DOCKER`. A tool that is unset or does not run, such as strace where
  `ptrace` is forbidden or Docker without a daemon, is absent, and every
  check, artifact and measurement that needs it is reported as skipped with
  the reason.
- Artifact kinds: the six the architecture subject used (function listings,
  undefined symbols, vectorization reports, object and linked disassembly,
  program output), plus normalized `strace -f` traces, `javap` listings, Java
  and Go program output, Go escape analysis and container output. Checks
  compile and run C, Java and Go programs whose own assertions must pass.
- A subject's `toolchain.json` records each tool's identity. An artifact is
  compared only when every tool it needs reports the recorded identity;
  otherwise it is skipped and the report says which version differs. Checks
  run with any version.
- `--record` and `--record-measurements [--only …]` are the only ways to
  rewrite files. A recorded measurement keeps its date, tool versions, kernel
  (`uname -r`), CPU, caches, whether it ran in a VM, in WSL or as root, the
  command, and an optional `ANVAYA_ENVIRONMENT` description. Timings carry no
  thresholds.
- Traces are made comparable by replacing process IDs with P1, P2 … and the
  temporary folder with `.`, and by starting from a marker line chosen by the
  lesson. The JVM runs without `JAVA_TOOL_OPTIONS`, `_JAVA_OPTIONS` and
  `JDK_JAVA_OPTIONS`, and Go with `GOTOOLCHAIN=local`. Containers run with no
  network, no capabilities and `no-new-privileges`.
- Setup scripts in `scripts/` extract each toolchain from Ubuntu packages
  without root, sharing `scripts/ubuntu-packages.sh`. By default they use the
  machine's package sources, as before; `ANVAYA_UBUNTU_SUITE=resolute` uses a
  private package list for Ubuntu 26.04 on another release. The GCC script
  also extracts binutils 2.46 and points GCC at it with a specs file. The
  architecture's two GCC scripts move there from its native lab.
- `verify-native.mjs` keeps its path and command and becomes the
  architecture's registry; `labs/operating-systems-runtime-internals/native/`
  holds the new subject's registry, toolchain record, test and README.

## Consequences

The architecture drift check still reports all 28 artifacts unchanged, on the
owner's toolchain reproduced on Ubuntu 24.04. A new subject adds a registry,
not a runner, and a new kind of evidence is added once. The runner's logic is
tested in every gate run with stand-in tools, and against the real JDK, Go
and strace when their variables are set. Cost: the gate needs more
variables to run every native check, and the GCC folder must be set up with
its binutils for listings to compare. The JDK cannot come from Ubuntu 26.04 on
older releases, because its build needs glibc 2.42, so the setup script takes
the machine's own build of the same version; its identity is the `javac`
version. Docker recordings still need the owner's machine where no daemon
runs, as in this change's cloud container.
