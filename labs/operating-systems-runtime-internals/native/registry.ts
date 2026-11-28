// Native lab for Operating Systems & Runtime Internals, registered with the
// shared native runner (scripts/native.ts, ADR 0010). Lessons add their C
// programs, traces, JVM and Go artifacts and measurements here; README.md
// says how to set up each toolchain. From the repository root:
//
//   node labs/operating-systems-runtime-internals/native/registry.ts
//
// with ANVAYA_CC, ANVAYA_BINUTILS, ANVAYA_STRACE, ANVAYA_JAVA_HOME, ANVAYA_GO
// and ANVAYA_DOCKER set for the tools you have; the rest are skipped.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  main,
  normalizeTrace,
  type Artifact,
  type CProgram,
  type Check,
  type Measurement,
  type Registry,
} from '../../../scripts/native.ts';

const directory = dirname(fileURLToPath(import.meta.url));
const C17 = ['-std=c17', '-O2'];

// serve, the running example (native/serve.c). After its first openat it
// makes only direct system calls, so its trace from there on does not depend
// on the C library's version, only on strace's.
const SERVE: CProgram = { sources: ['native/serve.c'], flags: C17 };
const REQUEST = { 'request.txt': 'GET /hello\n' };

/** `name,round,ns,calls` lines from system-calls/cost.c. */
function costRecords(csv: string) {
  const records = csv
    .trim()
    .split('\n')
    .map((line) => {
      const [call, round, ns, calls] = line.split(',');
      return {
        call,
        round: Number(round),
        nsPerCall: Number(ns),
        calls: Number(calls),
      };
    });
  if (records.some((r) => !(r.nsPerCall > 0) || !Number.isInteger(r.calls)))
    throw new Error('Invalid call-cost measurement');
  return records;
}

export const CHECKS: Check[] = [
  // system-calls: the cost program's own assertions at both levels.
  {
    sources: ['system-calls/cost.c'],
    levels: ['-O0', '-O2'],
    args: ['1000', '1'],
  },
];

export const ARTIFACTS: Artifact[] = [
  // system-calls: the numbers the call-path figure shows, and serve's own
  // system calls, from its first openat to its exit, when the request file
  // exists and when it does not.
  {
    kind: 'output',
    source: 'system-calls/numbers.c',
    flags: C17,
    file: 'system-calls/numbers.txt',
  },
  {
    kind: 'strace',
    program: SERVE,
    args: ['request.txt'],
    files: REQUEST,
    options: ['-s', '64'],
    from: 'openat(AT_FDCWD, "request.txt"',
    file: 'system-calls/serve-trace.txt',
  },
  {
    kind: 'strace',
    program: SERVE,
    args: ['missing.txt'],
    options: ['-s', '64'],
    from: 'openat(AT_FDCWD, "missing.txt"',
    status: 1,
    file: 'system-calls/serve-missing-trace.txt',
  },
  // processes: launcher.c runs the model's LAUNCHER program for real, with
  // serve built beside it. It prints names, not process IDs.
  {
    kind: 'output',
    source: 'processes/launcher.c',
    flags: C17,
    files: REQUEST,
    programs: { serve: SERVE },
    file: 'processes/launcher-output.txt',
  },
  // threads: share.c compares a thread and a forked child through /proc and
  // a shared global and descriptor. It prints comparisons, not IDs.
  {
    kind: 'output',
    source: 'threads/share.c',
    flags: [...C17, '-pthread'],
    file: 'threads/share-output.txt',
  },
];

/** share and wake lines from scheduling/fair.c. */
function fairRecords(csv: string) {
  const shares: {
    round: number;
    nice: number[];
    cpuUs: number[];
    runUs: number;
  }[] = [];
  const wakes: { round: number; neighbour: boolean; lateNs: number }[] = [];
  for (const line of csv.trim().split('\n')) {
    const [kind, ...fields] = line.split(',');
    const n = fields.map(Number);
    if (n.some((x) => !Number.isInteger(x) || x < 0))
      throw new Error(`Invalid scheduling line ${line}`);
    if (kind === 'share')
      shares.push({
        round: n[0]!,
        nice: [n[1]!, n[2]!],
        cpuUs: [n[3]!, n[4]!],
        runUs: n[5]!,
      });
    else if (kind === 'wake')
      wakes.push({ round: n[0]!, neighbour: n[1] === 1, lateNs: n[2]! });
    else throw new Error(`Invalid scheduling line ${line}`);
  }
  return { shares, wakes };
}

/** kind,batch,ns,trips,voluntary,involuntary lines from switch.c. */
function switchRecords(csv: string) {
  const records = csv
    .trim()
    .split('\n')
    .map((line) => {
      const [kind, batch, ns, trips, voluntary, involuntary] = line.split(',');
      return {
        kind,
        batch: Number(batch),
        nsPerRoundTrip: Number(ns),
        roundTrips: Number(trips),
        voluntary: Number(voluntary),
        involuntary: Number(involuntary),
      };
    });
  if (
    records.some(
      (r) =>
        !['pipe', 'processes', 'threads'].includes(r.kind!) ||
        !(r.nsPerRoundTrip > 0) ||
        !Number.isInteger(r.voluntary) ||
        !Number.isInteger(r.involuntary),
    )
  )
    throw new Error('Invalid context-switch measurement');
  return records;
}

export const MEASUREMENTS: Measurement[] = [
  // system-calls: serve's whole run, with strace's own summary of it.
  {
    kind: 'strace',
    program: SERVE,
    files: REQUEST,
    args: { quick: ['request.txt'], full: ['request.txt'] },
    options: ['-C', '-s', '64'],
    file: 'system-calls/serve-strace.json',
    parse: ({ trace, summary, stdout }) => {
      if (stdout !== 'serve: ok, 11 bytes\n')
        throw new Error(`serve printed ${stdout}`);
      return {
        request: REQUEST['request.txt'],
        stdout,
        // Process IDs become P1; the runner already replaced the folder.
        trace: normalizeTrace(trace, '\0').trimEnd().split('\n'),
        summary: summary.trimEnd().split('\n'),
      };
    },
  },
  // system-calls: getpid against clock_gettime, alternated, then the same
  // program under strace, which stops it at every system call.
  {
    source: 'system-calls/cost.c',
    flags: C17,
    args: { quick: ['1000', '1'], full: ['1000000', '15'] },
    file: 'system-calls/cost.json',
    parse: (csv) => ({ records: costRecords(csv) }),
  },
  {
    kind: 'strace',
    program: { sources: ['system-calls/cost.c'], flags: C17 },
    options: ['-e', 'trace=getpid'],
    args: { quick: ['100', '1'], full: ['10000', '15'] },
    file: 'system-calls/cost-traced.json',
    parse: ({ stdout }) => ({
      traced: 'strace -f -e trace=getpid',
      records: costRecords(stdout),
    }),
  },
  // scheduling: two busy processes at nice 0/0 and 0/5 on one CPU, and a
  // process that sleeps 10 ms at a time, without and with a busy neighbour.
  {
    source: 'scheduling/fair.c',
    flags: C17,
    args: { quick: ['100', '10', '1'], full: ['2000', '100', '5'] },
    file: 'scheduling/fair.json',
    parse: (csv) => fairRecords(csv),
  },
  // context-switches: a byte passed back and forth through two pipes by two
  // processes and by two threads on one CPU, and the same pipe work done by
  // one process without switching, in rotating order.
  {
    source: 'context-switches/switch.c',
    flags: [...C17, '-pthread'],
    args: { quick: ['1000', '2'], full: ['100000', '15'] },
    file: 'context-switches/switch.json',
    parse: (csv) => ({ records: switchRecords(csv) }),
  },
];

export const REGISTRY: Registry = {
  root: resolve(directory, '..'),
  toolchainFile: join(directory, 'toolchain.json'),
  checks: CHECKS,
  artifacts: ARTIFACTS,
  measurements: MEASUREMENTS,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(REGISTRY);
