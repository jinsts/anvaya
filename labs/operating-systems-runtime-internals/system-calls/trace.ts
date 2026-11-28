/**
 * The system-calls lesson's model: reading strace's output, and where a
 * call's work happens.
 *
 * Traces are the text `strace -f -o file` writes (strace 6.19): every line
 * starts with the process or thread ID that made the call, or the P1, P2 …
 * labels the native runner puts in its place. Only these forms
 * are read; any other line is refused, so a surprise is never miscounted:
 *
 *   7 read(3, "abc", 64) = 3                       a call that returned
 *   7 openat(AT_FDCWD, "x", O_RDONLY) = -1 ENOENT (No such file or directory)
 *   7 exit_group(0) = ?                            a call that never returned
 *   7 read(0,  <unfinished ...>                    a call another thread split
 *   7 <... read resumed>"q\n", 4096) = 2           …and its result
 *   7 --- SIGTERM {si_signo=SIGTERM, …} ---        a signal, not a call
 *   7 +++ exited with 0 +++                        an exit, not a call
 *
 * The call-path part assumes x86-64 Linux and the four functions the vdso(7)
 * manual lists for it; system-call numbers come from the recorded
 * `numbers.txt`, never from this file.
 */

export interface Call {
  /** The 1-based line where the call's result appeared. */
  line: number;
  /** The process or thread that made it, as the trace names it. */
  process: string;
  name: string;
  /**
   * The returned value; a label such as P1 where the runner replaced a
   * returned process ID; null when the call never returned (`= ?`).
   */
  result: number | string | null;
  /** The error name when the call failed, such as ENOENT. */
  error: string | null;
}

const PID = String.raw`(\d+|P\d+) `;
const COMPLETE = new RegExp(
  String.raw`^${PID}([a-z_][a-z0-9_]*)\((.*)\)\s+= (.+)$`,
);
const UNFINISHED = new RegExp(
  String.raw`^${PID}([a-z_][a-z0-9_]*)\(.* <unfinished \.\.\.>$`,
);
const RESUMED = new RegExp(
  String.raw`^${PID}<\.\.\. ([a-z_][a-z0-9_]*) resumed>.*\)\s+= (.+)$`,
);
const NOT_A_CALL = new RegExp(String.raw`^${PID}(---|\+\+\+) .* (---|\+\+\+)$`);

/** A call's result text: a number, hex or `?`, then an error or a note. */
function outcome(
  text: string,
): { result: number | string | null; error: string | null } | null {
  const match = text.match(
    /^(-?\d+|0x[0-9a-f]+|P\d+|\?)(?: ([A-Z][A-Z0-9_]*) \(.*\)| \(.*\))?$/,
  );
  if (!match) return null;
  const value = match[1]!;
  return {
    result:
      value === '?' ? null : value.startsWith('P') ? value : Number(value),
    error: match[2] ?? null,
  };
}

/** Parses an `strace -f -o` trace into its calls, in the order they ended. */
export function parseTrace(text: string): Call[] {
  const calls: Call[] = [];
  const pending = new Map<string, string>();
  text.split('\n').forEach((raw, index) => {
    const line = raw.trimEnd();
    const number = index + 1;
    if (line === '' || NOT_A_CALL.test(line)) return;
    const refuse = () => {
      throw new SyntaxError(
        `line ${number} is not a trace line this model reads: ${line}`,
      );
    };
    const unfinished = line.match(UNFINISHED);
    if (unfinished) {
      pending.set(unfinished[1]!, unfinished[2]!);
      return;
    }
    const resumed = line.match(RESUMED);
    if (resumed) {
      const [, pid, name, rest] = resumed;
      if (pending.get(pid!) !== name)
        throw new SyntaxError(
          `line ${number} resumes a ${name} that process ${pid} never started`,
        );
      pending.delete(pid!);
      const ended = outcome(rest!) ?? refuse();
      calls.push({ line: number, process: pid!, name: name!, ...ended! });
      return;
    }
    const complete = line.match(COMPLETE);
    if (!complete) return refuse();
    const ended = outcome(complete[4]!) ?? refuse();
    calls.push({
      line: number,
      process: complete[1]!,
      name: complete[2]!,
      ...ended!,
    });
  });
  return calls;
}

export interface Summary {
  /** Calls that returned, per name: what strace -c counts. */
  calls: Record<string, number>;
  /** Calls that returned an error, per name. */
  errors: Record<string, number>;
  /** Bytes moved by successful read and pread64 calls. */
  bytesRead: number;
  /** Bytes moved by successful write and pwrite64 calls. */
  bytesWritten: number;
}

const READS = new Set(['read', 'pread64']);
const WRITES = new Set(['write', 'pwrite64']);

/**
 * Counts calls the way strace -c does: a call that never returned, such as
 * exit_group, has no exit to count. A failed call counts as a call and an
 * error.
 */
export function summarize(calls: readonly Call[]): Summary {
  const summary: Summary = {
    calls: {},
    errors: {},
    bytesRead: 0,
    bytesWritten: 0,
  };
  for (const call of calls) {
    if (call.result === null) continue;
    summary.calls[call.name] = (summary.calls[call.name] ?? 0) + 1;
    if (call.error)
      summary.errors[call.name] = (summary.errors[call.name] ?? 0) + 1;
    else if (typeof call.result === 'number' && call.result >= 0) {
      if (READS.has(call.name)) summary.bytesRead += call.result;
      if (WRITES.has(call.name)) summary.bytesWritten += call.result;
    }
  }
  return summary;
}

export interface SummaryRow {
  name: string;
  calls: number;
  errors: number;
}

/** Reads the calls and errors columns of strace's own -c summary table. */
export function parseSummary(table: string): SummaryRow[] {
  const rows: SummaryRow[] = [];
  for (const line of table.split('\n')) {
    const match = line.match(
      /^\s*[\d.]+\s+[\d.]+\s+\d+\s+(\d+)\s+(?:(\d+)\s+)?([a-z_][a-z0-9_]*)$/,
    );
    if (match && match[3] !== 'total')
      rows.push({
        name: match[3]!,
        calls: Number(match[1]),
        errors: Number(match[2] ?? 0),
      });
  }
  if (!rows.length) throw new SyntaxError('No strace summary rows found');
  return rows;
}

/** Splits a trace's lines at the first one containing `marker`. */
export function splitAt(
  trace: string,
  marker: string,
): { before: string; after: string } {
  const lines = trace.split('\n');
  const index = lines.findIndex((line) => line.includes(marker));
  if (index < 0) throw new RangeError(`The trace never shows ${marker}`);
  return {
    before: lines.slice(0, index).join('\n'),
    after: lines.slice(index).join('\n'),
  };
}

/** `name number` lines, as numbers.c prints them from <sys/syscall.h>. */
export function parseNumbers(text: string): Record<string, number> {
  const numbers: Record<string, number> = {};
  for (const line of text.trim().split('\n')) {
    const match = line.match(/^([a-z_][a-z0-9_]*) (\d+)$/);
    if (!match) throw new SyntaxError(`Not a "name number" line: ${line}`);
    numbers[match[1]!] = Number(match[2]);
  }
  return numbers;
}

/** The x86-64 vDSO's functions, from vdso(7): no kernel entry needed. */
export const VDSO = [
  'clock_gettime',
  'gettimeofday',
  'time',
  'getcpu',
] as const;

export interface Step {
  where: 'user' | 'kernel';
  /** A few words for a diagram box. */
  label: string;
  what: string;
}
export interface CallPath {
  name: string;
  /** The system-call number; null for a call the vDSO answers. */
  number: number | null;
  entersKernel: boolean;
  steps: Step[];
}

/** Where the work of a C library call happens, step by step. */
export function callPath(
  name: string,
  numbers: Record<string, number>,
): CallPath {
  if ((VDSO as readonly string[]).includes(name))
    return {
      name,
      number: null,
      entersKernel: false,
      steps: [
        {
          where: 'user',
          label: `${name}()`,
          what: `your code calls ${name}()`,
        },
        {
          where: 'user',
          label: 'C library → vDSO',
          what: 'the C library calls the vDSO, code the kernel mapped into the process',
        },
        {
          where: 'user',
          label: 'read kernel data',
          what: 'the vDSO reads data the kernel keeps up to date in memory the process can read',
        },
        {
          where: 'user',
          label: 'return',
          what: 'it returns like an ordinary function: no system call',
        },
      ],
    };
  const number = numbers[name];
  if (number === undefined)
    throw new RangeError(`No recorded system-call number for ${name}`);
  return {
    name,
    number,
    entersKernel: true,
    steps: [
      { where: 'user', label: `${name}()`, what: `your code calls ${name}()` },
      {
        where: 'user',
        label: `eax = ${number}; syscall`,
        what: `the C library's wrapper puts ${number} in eax and any arguments in rdi, rsi, rdx, r10, r8 and r9, then runs syscall`,
      },
      {
        where: 'kernel',
        label: 'entry: save, check',
        what: 'the kernel’s entry code saves your registers and checks the number',
      },
      {
        where: 'kernel',
        label: `table[${number}] → ${name}`,
        what: `the system-call table's entry ${number} runs the ${name} handler`,
      },
      {
        where: 'kernel',
        label: 'result in rax',
        what: 'the result goes back in rax and the CPU returns to user mode',
      },
      {
        where: 'user',
        label: '−1 and errno on error',
        what: 'the wrapper turns a negative result into -1 and errno',
      },
    ],
  };
}

function counts(record: Record<string, number>): string {
  const entries = Object.entries(record);
  return entries.length
    ? entries.map(([name, n]) => `${name} ${n}`).join(', ')
    : 'none';
}

/**
 * The lesson's verified output: serve's own calls from the recorded trace
 * (serve-trace.txt) and two call paths from the recorded numbers.
 */
export function systemCallsExample(
  serveTrace: string,
  numbersText: string,
): string {
  const calls = parseTrace(serveTrace);
  const summary = summarize(calls);
  const unreturned = calls.filter((c) => c.result === null).map((c) => c.name);
  const numbers = parseNumbers(numbersText);
  const total = Object.values(summary.calls).reduce((a, b) => a + b, 0);
  const path = (name: string) => {
    const p = callPath(name, numbers);
    return p.entersKernel
      ? `${name}: system call ${p.number}`
      : `${name}: vDSO, no system call`;
  };
  return [
    `${total} calls counted: ${counts(summary.calls)}`,
    `errors: ${counts(summary.errors)}; never returned: ${unreturned.join(', ') || 'none'}`,
    `${summary.bytesRead} bytes read, ${summary.bytesWritten} bytes written`,
    `${path('getpid')}; ${path('clock_gettime')}`,
  ].join('\n');
}
