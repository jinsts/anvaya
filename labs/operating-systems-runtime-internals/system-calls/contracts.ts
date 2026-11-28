import { expect, it } from 'vitest';
// solve(trace) summarizes the text of `strace -f -o file`, where every line
// starts with a process ID. Return { calls, errors, bytesRead, bytesWritten }:
// - calls: per system-call name, the calls that returned, as strace -c counts
//   them. A call that never returned (`= ?`, such as exit_group) is not
//   counted. A failed call (`= -1 ENOENT (…)`) counts as a call and an error.
// - errors: per name, the calls that returned an error.
// - bytesRead and bytesWritten: the results of successful read and pread64,
//   and of successful write and pwrite64, calls.
// A call split by another thread, `name(… <unfinished ...>`, counts once,
// on its `<... name resumed>` line. Signal (`--- … ---`) and exit
// (`+++ … +++`) lines and blank lines are not calls. Throw a SyntaxError whose
// message contains `line N` for any other line, and for a resumed line whose
// process never started that call.
type Summary = {
  calls: Record<string, number>;
  errors: Record<string, number>;
  bytesRead: number;
  bytesWritten: number;
};
const none = { calls: {}, errors: {}, bytesRead: 0, bytesWritten: 0 };

export function contracts(solve: (trace: string) => Summary) {
  it('unseen case 1', () =>
    expect(
      solve(
        [
          '3 openat(AT_FDCWD, "a.txt", O_RDONLY) = 3',
          '3 read(3, "abc", 64) = 3',
          '3 read(3, "", 61) = 0',
          '3 close(3) = 0',
        ].join('\n'),
      ),
    ).toEqual({
      calls: { openat: 1, read: 2, close: 1 },
      errors: {},
      bytesRead: 3,
      bytesWritten: 0,
    }));
  it('unseen case 2', () =>
    expect(
      solve(
        [
          '21 mkdir("logs", 0755) = -1 EEXIST (File exists)',
          '21 write(1, "logs exists\\n", 12) = 12',
          '21 mkdir("logs/2026", 0755) = 0',
        ].join('\n'),
      ),
    ).toEqual({
      calls: { mkdir: 2, write: 1 },
      errors: { mkdir: 1 },
      bytesRead: 0,
      bytesWritten: 12,
    }));
  it('unseen case 3', () =>
    expect(
      solve('5 getppid() = 1\n5 exit_group(3) = ?\n5 +++ exited with 3 +++\n'),
    ).toEqual({ ...none, calls: { getppid: 1 } }));
  it('unseen case 4', () =>
    expect(
      solve(
        [
          '10 read(0,  <unfinished ...>',
          '11 write(1, "tick\\n", 5) = 5',
          '11 write(1, "tick\\n", 5) = 5',
          '10 <... read resumed>"q\\n", 4096) = 2',
        ].join('\n'),
      ),
    ).toEqual({
      calls: { write: 2, read: 1 },
      errors: {},
      bytesRead: 2,
      bytesWritten: 10,
    }));
  it('unseen case 5', () =>
    expect(
      solve(
        [
          '12 kill(13, SIGTERM) = 0',
          '13 --- SIGTERM {si_signo=SIGTERM, si_code=SI_USER, si_pid=12, si_uid=1000} ---',
          '13 +++ killed by SIGTERM +++',
          '',
        ].join('\n'),
      ),
    ).toEqual({ ...none, calls: { kill: 1 } }));
  it('unseen case 6', () =>
    expect(
      solve(
        [
          '4 mmap(NULL, 4096, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f2b4c000000',
          '4 pread64(3, "header", 100, 0) = 100',
          '4 pwrite64(5, "footer", 50, 512) = 50',
          '4 write(5, "x", 1) = -1 ENOSPC (No space left on device)',
        ].join('\n'),
      ),
    ).toEqual({
      calls: { mmap: 1, pread64: 1, pwrite64: 1, write: 1 },
      errors: { write: 1 },
      bytesRead: 100,
      bytesWritten: 50,
    }));
  it('unseen case 7', () => expect(solve('')).toEqual(none));
  it('unseen case 8', () =>
    expect(() => solve('7 getpid() = 7\nstrace: Process 7 attached')).toThrow(
      expect.objectContaining({
        name: 'SyntaxError',
        message: expect.stringContaining('line 2'),
      }),
    ));
  it('unseen case 9', () =>
    expect(() => solve('9 <... read resumed>"x", 1) = 1')).toThrow(
      expect.objectContaining({
        name: 'SyntaxError',
        message: expect.stringContaining('line 1'),
      }),
    ));
}
