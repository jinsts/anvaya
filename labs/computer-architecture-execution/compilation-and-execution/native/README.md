# Native bridge

The recorded target is Linux x86-64, System V ABI, GCC 15.2.0. From the repository
root, set `ANVAYA_CC` to a GCC-compatible C compiler, ensure GNU `nm` is available, and run:

```sh
ANVAYA_CC=cc node labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs
```

This checks executable assertions at O0/O2, collects assembly in a temporary
folder, and verifies both locality traversal checksums for all twelve trials.
`ANVAYA_CC=cc pnpm test` includes this native verification in the regular suite;
without the variable that environment-dependent test is explicitly skipped.
Use `--record` on the script to intentionally refresh committed artifacts, then
review compiler/target metadata and lesson measurements. Timing has no passing
speed threshold. The temporary directory is removed even on failure.

`bump-O0.txt` and `bump-O2.txt` are the compiler's complete function listings,
including directives. They are display artifacts, not handwritten assembly.
`program.c` checks that both returned value and pointed-to storage become 8.
The shared benchmark source and actual recorded observations live beside the
performance lab. Its 16 MiB input is initialized before timing, first traversal
order alternates, and results remain observable through checked checksums.
Hardware counters and CPU affinity were not controlled by this experiment.
