// Native lab for Computer Architecture & Execution: the subject's C programs,
// their compiler artifacts and its measurements, registered with the shared
// native runner (scripts/native.ts, ADR 0010). From the repository root:
//
//   ANVAYA_CC=/tmp/anvaya-cc/compiler ANVAYA_BINUTILS=/tmp/anvaya-cc/bin \
//     node labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs
//
// Artifacts depend on the compiler and binutils, so the drift check compares
// them only when both report the versions in toolchain.json and otherwise
// reports them as skipped. `--record` rewrites the artifacts deliberately;
// `--record-measurements [--only <text>]` rewrites the measurement files.
// Timings are never compared or thresholded.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { main } from '../../../../scripts/native.ts';

const directory = dirname(fileURLToPath(import.meta.url));

// Each artifact is regenerated on every run. `file` is relative to the
// subject folder so lessons and labs can keep their own artifacts.
const native = 'compilation-and-execution/native';
// Flags that let GCC reorder floating-point additions in a reduction.
const REASSOCIATE = [
  '-fassociative-math',
  '-fno-signed-zeros',
  '-fno-trapping-math',
];
export const SIMD_ARTIFACTS = [
  { symbol: 'add_arrays', name: 'add-O2', flags: ['-O2'] },
  {
    symbol: 'add_arrays',
    name: 'add-scalar',
    flags: ['-O2', '-fno-tree-vectorize'],
  },
  { symbol: 'sum_floats', name: 'sum-O3', flags: ['-O3'] },
  {
    symbol: 'sum_floats',
    name: 'sum-O3-reassociate',
    flags: ['-O3', ...REASSOCIATE],
  },
];

// One kernel, three builds: vectorized, branch-free with a conditional move,
// and with if-conversion and vectorization disabled so a branch remains.
export const BRANCH_VARIANTS = [
  { label: 'vector', flags: ['-O2'] },
  { label: 'cmov', flags: ['-O1'] },
  {
    label: 'branch',
    flags: [
      '-O2',
      '-fno-tree-vectorize',
      '-fno-if-conversion',
      '-fno-if-conversion2',
    ],
  },
];

/** @type {import('../../../../scripts/native.ts').Artifact[]} */
export const ARTIFACTS = [
  {
    kind: 'asm',
    source: `${native}/program.c`,
    flags: ['-O0', '-fno-inline'],
    symbol: 'bump',
    file: `${native}/bump-O0.txt`,
  },
  {
    kind: 'asm',
    source: `${native}/program.c`,
    flags: ['-O2', '-fno-inline'],
    symbol: 'bump',
    file: `${native}/bump-O2.txt`,
  },
  {
    kind: 'undefined-symbols',
    source: `${native}/program.c`,
    flags: ['-O2', '-fno-inline'],
    file: `${native}/object-symbols.txt`,
  },
  ...['-O0', '-O2'].flatMap((level) => [
    {
      kind: 'asm',
      source: 'reading-assembly/sum.c',
      flags: [level],
      symbol: 'sum_to',
      file: `reading-assembly/sum${level}.txt`,
    },
    {
      kind: 'asm',
      source: 'reading-assembly/scale.c',
      flags: [level],
      symbol: 'scale_sum',
      file: `reading-assembly/scale${level}.txt`,
    },
  ]),
  ...['sum.c:sum_to', 'scale.c:scale_sum'].map((entry) => {
    const [file, symbol] = entry.split(':');
    return {
      kind: 'asm',
      compiler: 'arm64',
      source: `reading-assembly/${file}`,
      flags: ['-O2'],
      symbol,
      file: `reading-assembly/${file.replace('.c', '')}-arm64-O2.txt`,
    };
  }),
  ...SIMD_ARTIFACTS.map((a) => ({
    kind: 'asm',
    source: 'simd/simd.c',
    flags: a.flags,
    symbol: a.symbol,
    file: `simd/${a.name}.txt`,
  })),
  ...[['-O2'], ['-O3'], ['-O3', ...REASSOCIATE]].map((flags) => ({
    kind: 'vec-report',
    source: 'simd/simd.c',
    flags,
    file: `simd/report${flags.length > 1 ? '-O3-reassociate' : flags[0]}.txt`,
  })),
  ...BRANCH_VARIANTS.map((variant) => ({
    kind: 'asm',
    source: 'branch-prediction/kernel.c',
    flags: variant.flags,
    symbol: 'sum_large',
    file: `branch-prediction/kernel-${variant.label}.txt`,
  })),
  ...['publish', 'consume', 'publish_seq_cst', 'count_hit'].map((symbol) => ({
    kind: 'asm',
    source: 'multicore/atomics.c',
    flags: ['-O2'],
    symbol,
    file: `multicore/${symbol}-O2.txt`,
  })),
  ...['publish', 'consume'].map((symbol) => ({
    kind: 'asm',
    compiler: 'arm64',
    source: 'multicore/atomics.c',
    flags: ['-O2'],
    symbol,
    file: `multicore/${symbol}-arm64-O2.txt`,
  })),
  {
    kind: 'object-disassembly',
    source: 'reading-assembly/scale.c',
    flags: ['-O2'],
    symbol: 'scale_sum',
    file: 'compilation-and-execution/native/scale-object.txt',
  },
  {
    kind: 'linked-disassembly',
    sources: ['main.c', 'sum.c', 'scale.c'].map((f) => `reading-assembly/${f}`),
    flags: ['-O2'],
    symbols: ['sum_to', 'scale_sum'],
    file: 'compilation-and-execution/native/scale-linked.txt',
  },
  {
    kind: 'output',
    source: 'text-encoding-and-memory-layout/representation.c',
    flags: ['-std=c17', '-O2'],
    file: 'text-encoding-and-memory-layout/representation-output.txt',
  },
];

// Programs whose assertions must pass at each listed optimization level.
/** @type {import('../../../../scripts/native.ts').Check[]} */
const CHECKED = [
  { sources: [`${native}/program.c`], levels: ['-O0', '-O2'] },
  {
    sources: ['simd/main.c', 'simd/simd.c'],
    levels: ['-O2', '-O3'],
  },
  {
    sources: ['main.c', 'sum.c', 'scale.c'].map((f) => `reading-assembly/${f}`),
    levels: ['-O0', '-O2'],
  },
  {
    sources: ['multicore/atomics_main.c', 'multicore/atomics.c'],
    levels: ['-O0', '-O2'],
    flags: ['-pthread'],
  },
];

/** @type {import('../../../../scripts/native.ts').Measurement[]} */
export const MEASUREMENTS = [
  {
    source: 'multicore/false_sharing.c',
    flags: ['-std=c17', '-O2', '-pthread'],
    file: 'multicore/false-sharing.json',
    args: { quick: ['quick'], full: [] },
    parse(csv) {
      const records = csv
        .trim()
        .split('\n')
        .map((line) => {
          const [layout, rep, ns, check] = line.split(',');
          return {
            layout,
            rep: Number(rep),
            nsPerIncrement: Number(ns),
            iterations: Number(check),
          };
        });
      if (records.some((r) => !(r.nsPerIncrement > 0)))
        throw new Error('Invalid false-sharing measurement');
      return { threads: 2, records };
    },
  },
  {
    // The harness is built at -O2; only the kernel's flags vary.
    kind: 'c-variants',
    variants: BRANCH_VARIANTS,
    kernel: 'branch-prediction/kernel.c',
    harness: 'branch-prediction/harness.c',
    file: 'branch-prediction/sorted-random.json',
    args: { quick: ['quick'], full: [] },
    parse(csv) {
      const records = csv
        .trim()
        .split('\n')
        .map((line) => {
          const [order, rep, ns, sum] = line.split(',');
          return { order, rep: Number(rep), nsPerElement: Number(ns), sum };
        });
      if (
        new Set(records.map((r) => r.sum)).size !== 1 ||
        records.some((r) => !(r.nsPerElement > 0))
      )
        throw new Error('Invalid sorted/random measurement');
      return records;
    },
  },
  {
    source: 'dram-ssd-and-disks/sweep.c',
    flags: ['-std=c17', '-O2'],
    file: 'dram-ssd-and-disks/sweep.json',
    // Quick mode checks correctness in tests; full mode records the sweep.
    args: { quick: ['quick'], full: [] },
    parse(csv) {
      const records = csv
        .trim()
        .split('\n')
        .map((line) => {
          const [size, rep, loads, ns, end] = line.split(',').map(Number);
          return { size, rep, loads, nsPerLoad: ns, end };
        });
      const ends = new Map();
      for (const r of records) {
        if (!Number.isFinite(r.nsPerLoad) || r.nsPerLoad <= 0)
          throw new Error('Invalid sweep timing');
        if (ends.has(r.size) && ends.get(r.size) !== r.end)
          throw new Error(`Sweep chase ended differently for ${r.size}`);
        ends.set(r.size, r.end);
      }
      return { lineBytes: 64, records };
    },
  },
  {
    source: 'measuring-performance/timing.c',
    flags: ['-std=c17', '-O2'],
    file: 'measuring-performance/timing.json',
    args: { quick: ['quick'], full: [] },
    parse(csv) {
      const records = csv
        .trim()
        .split('\n')
        .map((line) => {
          const [state, round, ns, checksum] = line.split(',');
          return {
            state,
            round: Number(round),
            nsPerElement: Number(ns),
            checksum,
          };
        });
      if (
        new Set(records.map((r) => r.checksum)).size !== 1 ||
        records.some((r) => !(r.nsPerElement > 0))
      )
        throw new Error('Invalid timing measurement');
      return { elements: 1 << 20, sweepBytes: 64 << 20, records };
    },
  },
  {
    source: 'architecture-and-performance/locality.c',
    flags: ['-O2', '-fno-loop-interchange'],
    file: 'architecture-and-performance/measurement.json',
    parse(csv) {
      const records = csv
        .trim()
        .split('\n')
        .map((line) => {
          const [trial, order, seconds, checksum] = line.split(',');
          return {
            trial: Number(trial),
            order,
            seconds: Number(seconds),
            checksum,
          };
        });
      if (
        records.length !== 12 ||
        new Set(records.map((r) => r.checksum)).size !== 1 ||
        records.some((r) => !Number.isFinite(r.seconds) || r.seconds < 0)
      )
        throw new Error('Invalid locality measurement');
      return { size: 2048, records };
    },
  },
];

export const REGISTRY = {
  root: resolve(directory, '../..'),
  toolchainFile: join(directory, 'toolchain.json'),
  checks: CHECKED,
  artifacts: ARTIFACTS,
  measurements: MEASUREMENTS,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(REGISTRY);
