// Shared native lab for Computer Architecture & Execution.
//
// Compiles the subject's C programs with ANVAYA_CC, runs their assertions,
// regenerates every deterministic artifact (assembly listings, symbol tables,
// program output) and compares it with the committed copy, then runs the
// measurements and validates their checksums. `--record` rewrites the
// artifacts instead of comparing them; `--record-measurements` rewrites the
// measurement files.
//
// Artifacts depend on the compiler, so the drift check runs only when the
// compiler reports the recorded version (toolchain.json); otherwise it is
// reported as skipped. Timings are never compared or thresholded.
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { arch, cpus, platform, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const subject = resolve(directory, '../..');
const compiler = process.env.ANVAYA_CC || 'cc';
// Optional: a GCC targeting aarch64, used only for -S listings.
const arm64 = process.env.ANVAYA_CC_ARM64 || null;
// --record rewrites the deterministic artifacts and toolchain.json;
// --record-measurements also rewrites the measurement files.
const record = process.argv.includes('--record');
const recordMeasurements = process.argv.includes('--record-measurements');
// --only <text>: limit recorded measurements to files containing <text>.
const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex > 0 ? process.argv[onlyIndex + 1] : null;
const run = (file, args, options = {}) =>
  execFileSync(file, args, { encoding: 'utf8', ...options });

/** Version text without the program name, e.g. "(Ubuntu 15.2.0-16ubuntu1) 15.2.0". */
const versionLine = run(compiler, ['--version']).split('\n')[0];
const describe = (cc) => ({
  version: run(cc, ['--version'])
    .split('\n')[0]
    .replace(/^\S+\s+/, ''),
  target: run(cc, ['-dumpmachine']).trim(),
});
const toolchain = {
  ...describe(compiler),
  // The system binutils assemble, link and disassemble.
  binutils: run('objdump', ['--version']).split('\n')[0],
  ...(arm64 ? { arm64: describe(arm64) } : {}),
};
const toolchainFile = join(directory, 'toolchain.json');
const recordedToolchain = existsSync(toolchainFile)
  ? JSON.parse(readFileSync(toolchainFile, 'utf8'))
  : null;
const sameToolchain =
  recordedToolchain?.version === toolchain.version &&
  recordedToolchain?.target === toolchain.target &&
  recordedToolchain?.binutils === toolchain.binutils;
const sameArm64 =
  !!toolchain.arm64 &&
  recordedToolchain?.arm64?.version === toolchain.arm64.version &&
  recordedToolchain?.arm64?.target === toolchain.arm64.target;

/** Lines of one function from GCC's assembly output, through its .size directive. */
function functionListing(assembly, symbol) {
  // Both GCC targets end a function with a .size directive.
  const pattern = new RegExp(
    `^${symbol}:\\n[\\s\\S]*?^\\s*\\.size\\s+${symbol}[^\\n]*`,
    'm',
  );
  const match = assembly.match(pattern);
  if (!match)
    throw new Error(
      `Expected a GCC listing for ${symbol}; use the recorded targets.`,
    );
  return match[0] + '\n';
}

/** One function's block from objdump output, through the next blank line. */
function objdumpBlock(text, symbol) {
  const start = text.indexOf(`<${symbol}>:\n`);
  if (start < 0) throw new Error(`objdump shows no ${symbol}`);
  const lineStart = text.lastIndexOf('\n', start) + 1;
  const end = text.indexOf('\n\n', start);
  return text.slice(lineStart, end < 0 ? undefined : end) + '\n';
}

// Each artifact is regenerated on every run. `file` is relative to the
// subject folder so lessons and labs can keep their own artifacts.
const native = 'compilation-and-execution/native';
/**
 * @typedef {{
 *   kind: string; file: string; flags: string[]; compiler?: string;
 *   source?: string; sources?: string[]; symbol?: string; symbols?: string[];
 * }} Artifact
 * @type {Artifact[]}
 */
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
const CHECKED = [
  { sources: [`${native}/program.c`], levels: ['-O0', '-O2'] },
  {
    sources: ['main.c', 'sum.c', 'scale.c'].map((f) => `reading-assembly/${f}`),
    levels: ['-O0', '-O2'],
  },
];

export const MEASUREMENTS = [
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

function caches() {
  try {
    return run('lscpu', ['--caches']);
  } catch {
    return null;
  }
}

const temporary = mkdtempSync(join(tmpdir(), 'anvaya-native-'));
const report = { toolchain, drift: [], checked: [], measurements: [] };
try {
  const build = (source, flags, output, extra = []) =>
    run(compiler, [...flags, ...extra, join(subject, source), '-o', output]);

  for (const { sources, levels } of CHECKED)
    for (const level of levels) {
      const executable = join(temporary, `checked${report.checked.length}`);
      run(compiler, [
        level,
        '-fno-inline',
        ...sources.map((s) => join(subject, s)),
        '-o',
        executable,
      ]);
      run(executable, []);
      report.checked.push(`${sources.join(' + ')} ${level}`);
    }

  for (const [index, artifact] of ARTIFACTS.entries()) {
    const file = join(subject, artifact.file);
    if (artifact.compiler === 'arm64' && !arm64) {
      report.drift.push({ file: artifact.file, status: 'skipped' });
      continue;
    }
    let text;
    if (artifact.kind === 'asm') {
      const output = join(temporary, `artifact${index}.s`);
      run(artifact.compiler === 'arm64' ? arm64 : compiler, [
        ...artifact.flags,
        '-S',
        join(subject, artifact.source),
        '-o',
        output,
      ]);
      text = functionListing(readFileSync(output, 'utf8'), artifact.symbol);
    } else if (artifact.kind === 'undefined-symbols') {
      const output = join(temporary, `artifact${index}.o`);
      build(artifact.source, artifact.flags, output, ['-c']);
      text = run('nm', ['-u', output]);
    } else if (artifact.kind === 'object-disassembly') {
      const output = join(temporary, `artifact${index}.o`);
      build(artifact.source, artifact.flags, output, ['-c']);
      text = objdumpBlock(run('objdump', ['-dr', output]), artifact.symbol);
    } else if (artifact.kind === 'linked-disassembly') {
      const output = join(temporary, `artifact${index}`);
      run(compiler, [
        ...artifact.flags,
        ...(artifact.sources ?? []).map((s) => join(subject, s)),
        '-o',
        output,
      ]);
      run(output, []);
      const disassembly = run('objdump', ['-d', output]);
      const symbols = run('nm', [output])
        .split('\n')
        .filter((line) =>
          (artifact.symbols ?? []).some((s) => line.endsWith(` ${s}`)),
        )
        .sort();
      text =
        symbols.join('\n') +
        '\n\n' +
        (artifact.symbols ?? [])
          .map((s) => objdumpBlock(disassembly, s))
          .join('\n');
    } else if (artifact.kind === 'output') {
      const output = join(temporary, `artifact${index}`);
      build(artifact.source, artifact.flags, output);
      text = run(output, []);
    } else throw new Error(`Unknown artifact kind ${artifact.kind}`);

    const matches = artifact.compiler === 'arm64' ? sameArm64 : sameToolchain;
    if (record) writeFileSync(file, text);
    else if (!matches)
      report.drift.push({ file: artifact.file, status: 'skipped' });
    else {
      const committed = readFileSync(file, 'utf8');
      report.drift.push({
        file: artifact.file,
        status: committed === text ? 'same' : 'changed',
      });
    }
  }

  for (const measurement of MEASUREMENTS) {
    const executable = join(temporary, 'measurement');
    build(measurement.source, measurement.flags, executable);
    const recordThis =
      recordMeasurements && (!only || measurement.file.includes(only));
    const args = measurement.args
      ? recordThis
        ? measurement.args.full
        : measurement.args.quick
      : [];
    const data = measurement.parse(run(executable, args));
    const result = {
      date: new Date().toISOString(),
      compiler: versionLine,
      target: toolchain.target,
      platform: platform(),
      arch: arch(),
      cpu: cpus()[0]?.model,
      caches: caches(),
      flags: measurement.flags,
      ...data,
    };
    if (recordThis)
      writeFileSync(
        join(subject, measurement.file),
        JSON.stringify(result, null, 2) + '\n',
      );
    report.measurements.push({ file: measurement.file, ...result });
  }
  if (record)
    writeFileSync(toolchainFile, JSON.stringify(toolchain, null, 2) + '\n');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
console.log(JSON.stringify(report, null, 2));
const changed = report.drift.filter((d) => d.status === 'changed');
if (changed.length) {
  console.error(
    `Regenerated artifacts differ from the committed copies: ${changed
      .map((d) => d.file)
      .join(', ')}. Review the change, then rerun with --record.`,
  );
  process.exit(1);
}
