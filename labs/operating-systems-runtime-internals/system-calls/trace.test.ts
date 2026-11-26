import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  VDSO,
  callPath,
  parseNumbers,
  parseSummary,
  parseTrace,
  splitAt,
  summarize,
  systemCallsExample,
} from './trace';

const dir = 'labs/operating-systems-runtime-internals/system-calls';
const read = (name: string) => readFileSync(`${dir}/${name}`, 'utf8');
const numbers = parseNumbers(read('numbers.txt'));
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2
    ? sorted[(n - 1) / 2]!
    : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
};

describe('reading a trace', () => {
  it('reads every line form strace -f -o writes for the lesson', () => {
    const calls = parseTrace(
      [
        '7 openat(AT_FDCWD, "x", O_RDONLY) = -1 ENOENT (No such file or directory)',
        '7 fcntl(3, F_GETFL)                 = 0x8002 (flags O_RDWR|O_LARGEFILE)',
        '7 read(0,  <unfinished ...>',
        '8 write(1, "f(x) = 5", 8) = 8',
        '7 <... read resumed>"q\\n", 4096) = 2',
        '8 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=7, si_uid=0} ---',
        '8 +++ killed by SIGTERM +++',
        '7 exit_group(0)                     = ?',
        '7 +++ exited with 0 +++',
        '',
      ].join('\n'),
    );
    expect(calls).toEqual([
      { line: 1, process: '7', name: 'openat', result: -1, error: 'ENOENT' },
      { line: 2, process: '7', name: 'fcntl', result: 0x8002, error: null },
      // A string argument may itself contain ") = ".
      { line: 4, process: '8', name: 'write', result: 8, error: null },
      // The split call ends where its result appears.
      { line: 5, process: '7', name: 'read', result: 2, error: null },
      { line: 8, process: '7', name: 'exit_group', result: null, error: null },
    ]);
  });

  it('refuses lines it does not read, naming the line', () => {
    expect(() => parseTrace('7 getpid() = 7\nnot a trace line')).toThrow(
      new SyntaxError(
        'line 2 is not a trace line this model reads: not a trace line',
      ),
    );
    expect(() => parseTrace('7 <... read resumed>"x", 1) = 1')).toThrow(
      'line 1 resumes a read that process 7 never started',
    );
    expect(() => parseTrace('7 read(3, "x", 1) = many')).toThrow(SyntaxError);
  });

  it('counts calls the way strace -c does', () => {
    const summary = summarize(
      parseTrace(
        [
          '3 openat(AT_FDCWD, "a", O_RDONLY) = 3',
          '3 pread64(3, "abcd", 4, 0) = 4',
          '3 read(3, "", 64) = 0',
          '3 write(1, "abcd", 4) = 4',
          '3 pwrite64(4, "ab", 2, 8) = -1 EBADF (Bad file descriptor)',
          '3 exit_group(0) = ?',
        ].join('\n'),
      ),
    );
    expect(summary).toEqual({
      calls: { openat: 1, pread64: 1, read: 1, write: 1, pwrite64: 1 },
      errors: { pwrite64: 1 },
      bytesRead: 4,
      bytesWritten: 4,
    });
    expect(summarize([])).toEqual({
      calls: {},
      errors: {},
      bytesRead: 0,
      bytesWritten: 0,
    });
  });

  it('reads strace’s summary table and the recorded numbers', () => {
    expect(
      parseSummary(
        [
          '% time     seconds  usecs/call     calls    errors syscall',
          '------ ----------- ----------- --------- --------- ----------------',
          ' 60.00    0.000006           6         1           getpid',
          ' 40.00    0.000004           4         2         1 access',
          '------ ----------- ----------- --------- --------- ----------------',
          '100.00    0.000010           3         3         1 total',
        ].join('\n'),
      ),
    ).toEqual([
      { name: 'getpid', calls: 1, errors: 0 },
      { name: 'access', calls: 2, errors: 1 },
    ]);
    expect(() => parseSummary('nothing here')).toThrow(SyntaxError);
    expect(numbers).toMatchObject({
      read: 0,
      write: 1,
      getpid: 39,
      clock_gettime: 228,
    });
    expect(() => parseNumbers('getpid thirty-nine')).toThrow(SyntaxError);
  });
});

describe('where a call’s work happens', () => {
  it('sends system calls through the kernel by number and keeps vDSO calls in user space', () => {
    const getpid = callPath('getpid', numbers);
    expect(getpid).toMatchObject({ number: 39, entersKernel: true });
    expect(getpid.steps.map((s) => s.where)).toEqual([
      'user',
      'user',
      'kernel',
      'kernel',
      'kernel',
      'user',
    ]);
    expect(callPath('read', numbers).steps[1]!.what).toContain('puts 0 in eax');
    for (const name of VDSO) {
      const path = callPath(name, numbers);
      expect(path.entersKernel).toBe(false);
      expect(path.steps.every((s) => s.where === 'user')).toBe(true);
    }
    expect(() => callPath('fork', numbers)).toThrow(
      new RangeError('No recorded system-call number for fork'),
    );
  });
});

describe('serve’s recorded run', () => {
  const run = JSON.parse(read('serve-strace.json')) as {
    trace: string[];
    summary: string[];
    stdout: string;
  };
  const trace = run.trace.join('\n');
  const marker = 'openat(AT_FDCWD, "request.txt"';

  it('agrees with strace’s own summary of the same run, call for call', () => {
    // The independent cross-check: strace counted the run itself.
    const model = summarize(parseTrace(trace));
    const strace = parseSummary(run.summary.join('\n'));
    expect(Object.keys(model.calls).sort()).toEqual(
      strace.map((r) => r.name).sort(),
    );
    for (const row of strace) {
      expect(model.calls[row.name]).toBe(row.calls);
      expect(model.errors[row.name] ?? 0).toBe(row.errors);
    }
    // exit_group is in the trace but never returned, so neither counts it.
    expect(trace).toContain('exit_group(0)');
    expect(strace.map((r) => r.name)).not.toContain('exit_group');
  });

  it('shows what the lesson says about it', () => {
    const model = summarize(parseTrace(trace));
    const total = (s: { calls: Record<string, number> }) =>
      Object.values(s.calls).reduce((a, b) => a + b, 0);
    const { before, after } = splitAt(trace, marker);
    expect(total(model)).toBe(35);
    expect(model.errors).toEqual({ access: 1 });
    expect(total(summarize(parseTrace(before)))).toBe(29);
    expect(total(summarize(parseTrace(after)))).toBe(6);
    // The vDSO answered both clock_gettime calls: neither is in the trace.
    expect(trace).not.toContain('clock_gettime');
    expect(before).toContain('"/lib/x86_64-linux-gnu/libc.so.6"');
    expect(run.stdout).toBe('serve: ok, 11 bytes\n');
  });

  it('matches the drift-checked trace of serve’s own calls', () => {
    const own = read('serve-trace.txt');
    expect(splitAt(trace, marker).after.replace(/ +/g, ' ')).toBe(
      own.trim().replace(/ +/g, ' '),
    );
    const missing = summarize(parseTrace(read('serve-missing-trace.txt')));
    expect(missing).toEqual({
      calls: { openat: 1, write: 1 },
      errors: { openat: 1 },
      bytesRead: 0,
      bytesWritten: 46,
    });
  });
});

describe('the recorded call costs', () => {
  type Run = { records: { call: string; round: number; nsPerCall: number }[] };
  const plain = JSON.parse(read('cost.json')) as Run;
  const traced = JSON.parse(read('cost-traced.json')) as Run;
  const ns = (run: Run, call: string) =>
    run.records.filter((r) => r.call === call).map((r) => r.nsPerCall);

  it('alternated fifteen rounds of each call', () => {
    for (const run of [plain, traced]) {
      expect(ns(run, 'getpid')).toHaveLength(15);
      expect(ns(run, 'clock_gettime')).toHaveLength(15);
    }
  });

  it('shows getpid costing more than clock_gettime in every round', () => {
    for (let round = 0; round < 15; round++) {
      const of = (call: string) =>
        plain.records.find((r) => r.round === round && r.call === call)!
          .nsPerCall;
      expect(of('getpid')).toBeGreaterThan(of('clock_gettime'));
    }
    // "About three times as long", comparing medians.
    const ratio =
      median(ns(plain, 'getpid')) / median(ns(plain, 'clock_gettime'));
    expect(ratio).toBeGreaterThan(2.5);
    expect(ratio).toBeLessThan(3.5);
  });

  it('shows strace slowing getpid hundreds of times and clock_gettime not at all', () => {
    const slowest = Math.max(...ns(plain, 'getpid'));
    expect(Math.min(...ns(traced, 'getpid'))).toBeGreaterThan(100 * slowest);
    const clock =
      median(ns(traced, 'clock_gettime')) / median(ns(plain, 'clock_gettime'));
    expect(clock).toBeGreaterThan(0.8);
    expect(clock).toBeLessThan(1.25);
  });
});

it('prints the lesson output', () => {
  expect(systemCallsExample(read('serve-trace.txt'), read('numbers.txt'))).toBe(
    [
      '6 calls counted: openat 1, read 2, close 1, getpid 1, write 1',
      'errors: none; never returned: exit_group',
      '11 bytes read, 20 bytes written',
      'getpid: system call 39; clock_gettime: vDSO, no system call',
    ].join('\n'),
  );
});
