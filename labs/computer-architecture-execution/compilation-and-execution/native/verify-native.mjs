// Shared native lab for Computer Architecture & Execution.
//
// Compiles the subject's C programs with ANVAYA_CC, runs their assertions,
// regenerates every deterministic artifact (assembly listings, symbol tables,
// program output) and compares it with the committed copy, then runs the
// measurements and validates their checksums. `--record` rewrites the
// artifacts and measurement files instead of comparing them.
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
const record = process.argv.includes('--record');
const run = (file, args, options = {}) =>
  execFileSync(file, args, { encoding: 'utf8', ...options });

/** Version text without the program name, e.g. "(Ubuntu 15.2.0-16ubuntu1) 15.2.0". */
const versionLine = run(compiler, ['--version']).split('\n')[0];
const toolchain = {
  version: versionLine.replace(/^\S+\s+/, ''),
  target: run(compiler, ['-dumpmachine']).trim(),
};
const toolchainFile = join(directory, 'toolchain.json');
const recordedToolchain = existsSync(toolchainFile)
  ? JSON.parse(readFileSync(toolchainFile, 'utf8'))
  : null;
const sameToolchain =
  recordedToolchain?.version === toolchain.version &&
  recordedToolchain?.target === toolchain.target;

/** Lines of one function from GCC's assembly output, through its .size directive. */
function functionListing(assembly, symbol) {
  const pattern = new RegExp(
    `^${symbol}:\\n[\\s\\S]*?^\\s*\\.size\\s+${symbol}[^\\n]*`,
    'm',
  );
  const match = assembly.match(pattern);
  if (!match)
    throw new Error(
      `Expected an x86-64 GCC listing for ${symbol}; use the recorded target.`,
    );
  return match[0] + '\n';
}

// Each artifact is regenerated on every run. `file` is relative to the
// subject folder so lessons and labs can keep their own artifacts.
const native = 'compilation-and-execution/native';
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
  {
    kind: 'output',
    source: 'text-encoding-and-memory-layout/representation.c',
    flags: ['-std=c17', '-O2'],
    file: 'text-encoding-and-memory-layout/representation-output.txt',
  },
];

// Programs whose assertions must pass at each listed optimization level.
const CHECKED = [{ source: `${native}/program.c`, levels: ['-O0', '-O2'] }];

export const MEASUREMENTS = [
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

  for (const { source, levels } of CHECKED)
    for (const level of levels) {
      const executable = join(temporary, `checked${report.checked.length}`);
      build(source, [level, '-fno-inline'], executable);
      run(executable, []);
      report.checked.push(`${source} ${level}`);
    }

  for (const [index, artifact] of ARTIFACTS.entries()) {
    let text;
    if (artifact.kind === 'asm') {
      const output = join(temporary, `artifact${index}.s`);
      build(artifact.source, artifact.flags, output, ['-S']);
      text = functionListing(readFileSync(output, 'utf8'), artifact.symbol);
    } else if (artifact.kind === 'undefined-symbols') {
      const output = join(temporary, `artifact${index}.o`);
      build(artifact.source, artifact.flags, output, ['-c']);
      text = run('nm', ['-u', output]);
    } else if (artifact.kind === 'output') {
      const output = join(temporary, `artifact${index}`);
      build(artifact.source, artifact.flags, output);
      text = run(output, []);
    } else throw new Error(`Unknown artifact kind ${artifact.kind}`);

    const file = join(subject, artifact.file);
    if (record) writeFileSync(file, text);
    else if (!sameToolchain)
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
    const data = measurement.parse(run(executable, []));
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
    if (record)
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
