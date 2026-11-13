import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir, arch, platform, cpus } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = dirname(fileURLToPath(import.meta.url));
const performance = resolve(directory, '../../architecture-and-performance');
const temporary = mkdtempSync(join(tmpdir(), 'anvaya-native-'));
const compiler = process.env.ANVAYA_CC || 'cc';
const run = (file, args) => execFileSync(file, args, { encoding: 'utf8' });
try {
  const assembly = {};
  for (const level of ['0', '2']) {
    const output = join(temporary, `program-O${level}.s`);
    run(compiler, [
      '-O' + level,
      '-fno-inline',
      '-S',
      join(directory, 'program.c'),
      '-o',
      output,
    ]);
    const text = readFileSync(output, 'utf8');
    const match = text.match(/^bump:\n[\s\S]*?^\s*\.size\s+bump[^\n]*/m);
    if (!match)
      throw new Error(
        'Expected x86-64 GCC bump symbol; use the documented target.',
      );
    assembly[level] = match[0] + '\n';
    const executable = join(temporary, 'program' + level);
    run(compiler, [
      '-O' + level,
      '-fno-inline',
      join(directory, 'program.c'),
      '-o',
      executable,
    ]);
    run(executable, []);
  }
  const object = join(temporary, 'program.o');
  run(compiler, [
    '-O2',
    '-fno-inline',
    '-c',
    join(directory, 'program.c'),
    '-o',
    object,
  ]);
  const symbols = run('nm', ['-u', object]);
  if (!symbols.includes('__assert_fail'))
    throw new Error('Expected external assertion reference');
  const executable = join(temporary, 'locality');
  run(compiler, [
    '-O2',
    '-fno-loop-interchange',
    join(performance, 'locality.c'),
    '-o',
    executable,
  ]);
  const csv = run(executable, []);
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
    throw new Error('Invalid measurement record');
  const report = {
    date: new Date().toISOString(),
    compiler: run(compiler, ['--version']).split('\n')[0],
    platform: platform(),
    arch: arch(),
    cpu: cpus()[0]?.model,
    flags: ['-O2', '-fno-loop-interchange'],
    size: 2048,
    records,
  };
  if (process.argv.includes('--record')) {
    writeFileSync(join(directory, 'object-symbols.txt'), symbols);
    for (const [level, text] of Object.entries(assembly))
      writeFileSync(join(directory, `bump-O${level}.txt`), text);
    writeFileSync(
      join(performance, 'measurement.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
