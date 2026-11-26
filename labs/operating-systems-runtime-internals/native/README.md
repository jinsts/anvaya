# Native lab

The subject's native evidence: C programs and their system-call traces, JVM
and Go artifacts, container runs and measurements. `registry.ts` registers
them with the shared native runner (`scripts/native.ts`,
[ADR 0010](../../../docs/adr/0010-shared-native-runner.md)), which builds and
runs them, compares each deterministic artifact with its committed copy and
validates each measurement. `toolchain.json` records the tool versions the
artifacts were made with.

## Toolchains

Each toolchain is extracted from Ubuntu packages into a folder, without root.
The recorded versions came from Ubuntu 26.04 packages; on another Ubuntu
release, add `ANVAYA_UBUNTU_SUITE=resolute` to a setup command so it downloads
the 26.04 packages through a private package list (the JDK is the exception,
below).

| Tool                               | Setup                                                                           | Variable                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| GCC 15.2 and binutils 2.46         | `sh scripts/setup-gcc-ubuntu.sh /tmp/anvaya-cc`                                 | `ANVAYA_CC=/tmp/anvaya-cc/compiler`, `ANVAYA_BINUTILS=/tmp/anvaya-cc/bin` |
| strace 6.19                        | `sh scripts/setup-strace-ubuntu.sh /tmp/anvaya-strace`                          | `ANVAYA_STRACE=/tmp/anvaya-strace/strace`                                 |
| OpenJDK 21                         | `sh scripts/setup-jdk-ubuntu.sh /tmp/anvaya-jdk`                                | `ANVAYA_JAVA_HOME=/tmp/anvaya-jdk/root/usr/lib/jvm/java-21-openjdk-amd64` |
| Go 1.26                            | `sh scripts/setup-go-ubuntu.sh /tmp/anvaya-go`                                  | `ANVAYA_GO=/tmp/anvaya-go/root/usr/lib/go-1.26/bin/go`                    |
| Docker, with a daemon that answers | Docker Engine or Docker Desktop; containers run without capabilities or network | `ANVAYA_DOCKER=docker`                                                    |

Ubuntu 26.04's OpenJDK build needs glibc 2.42, so on an older release the JDK
script takes that release's own build of the same 21.0.13.1: set
`ANVAYA_UBUNTU_SUITE` to the machine's own suite, such as `noble`, if its
package lists are stale. Tracing needs `ptrace`, which some containers forbid;
the runner then reports strace as absent and says why.

## Run

From the repository root, with the variables for the tools you have:

```sh
node labs/operating-systems-runtime-internals/native/registry.ts
```

The report lists every tool as present or absent, with the reason, and every
artifact as `same`, `changed` or `skipped`. An artifact is compared only when
all the tools it needs report the versions in `toolchain.json`; otherwise it
is skipped. `pnpm test` runs the same registry through `native.test.ts`, which
skips the tests of any tool whose variable is unset.

Use `--record` to rewrite the artifacts and `toolchain.json`, and
`--record-measurements [--only <text>]` to rerun measurements in full and
rewrite their files, only on purpose; then review the change and the lessons
that display it. A recorded measurement stores its date, tool versions,
kernel (`uname -r`), CPU, whether it ran in a VM or WSL, and its command; set
`ANVAYA_ENVIRONMENT` to describe the machine in words. Timings carry no
thresholds: tests assert only what the lessons claim about the recorded data.

## Files

The lessons' programs and artifacts live in their lab folders and are listed
in `registry.ts`, which names the lesson that uses each one.
