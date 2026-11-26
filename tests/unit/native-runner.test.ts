import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  detectTools,
  functionListing,
  normalizeTrace,
  objdumpBlock,
  runNative,
  splitSummary,
  toolsFor,
  type Registry,
  type StraceRecording,
} from '../../scripts/native.ts';

// Stand-ins for the real toolchains, so the runner's own logic is tested the
// same way on every machine. Each answers its version question the way the
// real tool does and produces fixed output.
const script = (...lines: string[]) => ['#!/bin/sh', ...lines, ''].join('\n');
const FAKES: Record<string, string> = {
  'bin/cc': script(
    'case "$1" in',
    '  --version) echo "fakecc (Fake 1.0) 1.0"; exit 0 ;;',
    '  -dumpmachine) echo "x86_64-fake-linux-gnu"; exit 0 ;;',
    'esac',
    'out=',
    'while [ $# -gt 0 ]; do',
    '  if [ "$1" = -o ]; then out=$2; shift; fi',
    '  shift',
    'done',
    // The "program" prints its arguments.
    `printf '#!/bin/sh\\necho "ran $*"\\n' > "$out"`,
    'chmod +x "$out"',
  ),
  'binutils/objdump': script('echo "GNU objdump (Fake) 9.9"'),
  'bin/strace': script(
    'if [ "$1" = -V ]; then echo "strace -- version ${FAKE_STRACE_VERSION:-6.19}"; exit 0; fi',
    'out=/dev/null; summary=',
    'while [ $# -gt 0 ]; do',
    '  case "$1" in',
    '    -o) out=$2; shift 2 ;;',
    '    -C) summary=1; shift ;;',
    '    -*) shift ;;',
    '    *) break ;;',
    '  esac',
    'done',
    'if [ -n "$FAKE_STRACE_DENIED" ]; then echo "strace: ptrace(PTRACE_TRACEME, ...): Operation not permitted" >&2; exit 1; fi',
    '"$@" || exit $?',
    '{',
    `  printf '%s\\n' "4242 execve(\\"$1\\", [\\"$1\\"], 0x7ffd0000 /* 3 vars */) = 0"`,
    `  printf '%s\\n' "4242 getpid()                          = 4242"`,
    `  printf '%s\\n' "4243 write(1, \\"child of 4242 in $PWD\\", 9) = 9"`,
    `  printf '%s\\n' "4242 exit_group(0)                     = ?"`,
    `  printf '%s\\n' "4242 +++ exited with 0 +++"`,
    '  if [ -n "$summary" ]; then',
    `    printf '%s\\n' "% time     seconds  usecs/call     calls    errors syscall"`,
    `    printf '%s\\n' "100.00    0.000001           1         1           getpid"`,
    '  fi',
    '} > "$out"',
  ),
  'java/bin/javac': script(
    'if [ "$1" = -version ]; then echo "javac 21.0.13.1"; exit 0; fi',
    'touch "$2/Fake.class"',
  ),
  'java/bin/java': script(
    'if [ "$1" = -version ]; then echo \'openjdk version "21.0.13.1" 2026-11-17\' >&2; exit 0; fi',
    // The runner removes these, so a program never sees them.
    'if [ -n "$JAVA_TOOL_OPTIONS$_JAVA_OPTIONS" ]; then echo "options leaked"; exit 1; fi',
    'echo "java ran"',
  ),
  'java/bin/javap': script(
    'echo \'Compiled from "Fake.java"\'',
    'echo "class Fake {}"',
  ),
  'bin/go': script(
    'case "$1" in',
    '  version) echo "go version go1.26.8 linux/amd64" ;;',
    '  build) echo "# command-line-arguments" >&2; echo "$PWD/fake.go:3:6: can inline twice" >&2 ;;',
    '  run) echo "go ran" ;;',
    'esac',
  ),
  'bin/docker': script(
    'case "$1" in',
    '  version) echo "29.0.0" ;;',
    '  run) echo "container ran" ;;',
    'esac',
  ),
};

let fakes: string;
let lab: string;
let env: NodeJS.ProcessEnv;

beforeAll(() => {
  fakes = mkdtempSync(join(tmpdir(), 'anvaya-fakes-'));
  for (const [name, text] of Object.entries(FAKES)) {
    const file = join(fakes, name);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, text);
    chmodSync(file, 0o755);
  }
  env = {
    PATH: process.env.PATH,
    ANVAYA_CC: join(fakes, 'bin/cc'),
    ANVAYA_BINUTILS: join(fakes, 'binutils'),
    ANVAYA_STRACE: join(fakes, 'bin/strace'),
    ANVAYA_JAVA_HOME: join(fakes, 'java'),
    ANVAYA_GO: join(fakes, 'bin/go'),
    ANVAYA_DOCKER: join(fakes, 'bin/docker'),
    JAVA_TOOL_OPTIONS: '-Dnoise=1',
  };
});
afterAll(() => rmSync(fakes, { recursive: true, force: true }));

function freshLab(): Registry {
  lab = mkdtempSync(join(tmpdir(), 'anvaya-lab-'));
  for (const name of ['prog.c', 'Fake.java', 'fake.go'])
    writeFileSync(join(lab, name), `${name}\n`);
  return {
    root: lab,
    toolchainFile: join(lab, 'toolchain.json'),
    checks: [
      { sources: ['prog.c'], levels: ['-O0', '-O2'] },
      { kind: 'java', sources: ['Fake.java'], mainClass: 'Fake' },
      { kind: 'go', source: 'fake.go' },
    ],
    artifacts: [
      {
        kind: 'output',
        source: 'prog.c',
        flags: ['-O2'],
        args: ['a', 'b'],
        file: 'out/output.txt',
      },
      {
        kind: 'strace',
        program: { sources: ['prog.c'], flags: ['-O2'] },
        from: 'getpid',
        file: 'out/trace.txt',
      },
      {
        kind: 'javap',
        sources: ['Fake.java'],
        className: 'Fake',
        file: 'out/javap.txt',
      },
      {
        kind: 'java-output',
        sources: ['Fake.java'],
        mainClass: 'Fake',
        file: 'out/java.txt',
      },
      { kind: 'go-escape', source: 'fake.go', file: 'out/escape.txt' },
      { kind: 'go-output', source: 'fake.go', file: 'out/go.txt' },
      {
        kind: 'docker-output',
        image: 'fake:1',
        command: ['true'],
        file: 'out/docker.txt',
      },
    ],
    measurements: [
      {
        source: 'prog.c',
        flags: ['-O2'],
        file: 'out/measure.json',
        args: { quick: ['quick'], full: ['full'] },
        parse: (stdout: string) => ({ line: stdout.trim() }),
      },
      {
        kind: 'strace',
        program: { sources: ['prog.c'], flags: ['-O2'] },
        options: ['-C'],
        file: 'out/strace.json',
        parse: (recording: StraceRecording) => ({
          lines: recording.trace.trim().split('\n').length,
          summary: recording.summary.split('\n')[1],
          stdout: recording.stdout.trim(),
        }),
      },
    ],
  };
}

const read = (name: string) => readFileSync(join(lab, name), 'utf8');

describe('the shared native runner', () => {
  it('reports every tool absent, naming its variable, when none is set', () => {
    const tools = detectTools({ PATH: process.env.PATH });
    expect(
      Object.values(tools).map((t) => [t.tool, t.status, t.reason]),
    ).toEqual([
      ['cc', 'absent', 'ANVAYA_CC is not set'],
      ['cc-arm64', 'absent', 'ANVAYA_CC_ARM64 is not set'],
      ['strace', 'absent', 'ANVAYA_STRACE is not set'],
      ['java', 'absent', 'ANVAYA_JAVA_HOME is not set'],
      ['go', 'absent', 'ANVAYA_GO is not set'],
      ['docker', 'absent', 'ANVAYA_DOCKER is not set'],
    ]);
  });

  it('identifies each tool from its own version report', () => {
    const tools = detectTools(env);
    expect(tools.cc.identity).toEqual({
      version: '(Fake 1.0) 1.0',
      target: 'x86_64-fake-linux-gnu',
      binutils: 'GNU objdump (Fake) 9.9',
    });
    expect(tools.strace.identity).toEqual({
      version: 'strace -- version 6.19',
    });
    expect(tools.java.identity).toEqual({
      version: 'javac 21.0.13.1',
      runtime: 'openjdk version "21.0.13.1" 2026-11-17',
    });
    expect(tools.go.identity).toEqual({ version: 'go1.26.8 linux/amd64' });
    expect(tools.docker.identity).toEqual({ version: '29.0.0' });
  });

  it('reports strace absent, and why, when it may not trace', () => {
    const tools = detectTools({ ...env, FAKE_STRACE_DENIED: '1' });
    expect(tools.strace.status).toBe('absent');
    expect(tools.strace.reason).toContain('Operation not permitted');
  });

  it('records artifacts and the toolchain, then finds every artifact unchanged', () => {
    const registry = freshLab();
    const recorded = runNative(registry, { record: true, env });
    expect(recorded.drift.map((d) => d.status)).toEqual(
      Array(7).fill('recorded'),
    );
    expect(JSON.parse(read('toolchain.json'))).toMatchObject({
      cc: { version: '(Fake 1.0) 1.0' },
      strace: { version: 'strace -- version 6.19' },
      go: { version: 'go1.26.8 linux/amd64' },
    });
    expect(read('out/output.txt')).toBe('ran a b\n');
    // Process IDs become P1, P2 in order, the folder becomes "." and the
    // trace starts at the first getpid.
    expect(read('out/trace.txt')).toBe(
      [
        'P1 getpid()                          = P1',
        'P2 write(1, "child of P1 in .", 9) = 9',
        'P1 exit_group(0)                     = ?',
        'P1 +++ exited with 0 +++',
        '',
      ].join('\n'),
    );
    expect(read('out/escape.txt')).toBe(
      '# command-line-arguments\n./fake.go:3:6: can inline twice\n',
    );
    // The JVM never sees JAVA_TOOL_OPTIONS, so its output stays clean.
    expect(read('out/java.txt')).toBe('java ran\n');
    expect(read('out/docker.txt')).toBe('container ran\n');

    const again = runNative(registry, { env });
    expect(again.drift.map((d) => d.status)).toEqual(Array(7).fill('same'));
    expect(again.checked).toEqual([
      'prog.c -O0',
      'prog.c -O2',
      'Fake.java (java)',
      'fake.go (go)',
    ]);
    expect(again.skipped).toEqual([]);
  });

  it('reports an artifact that no longer matches its committed copy', () => {
    const registry = freshLab();
    runNative(registry, { record: true, env });
    writeFileSync(join(lab, 'out/output.txt'), 'edited by hand\n');
    const report = runNative(registry, { env });
    expect(report.drift.find((d) => d.file === 'out/output.txt')?.status).toBe(
      'changed',
    );
  });

  it('skips an artifact whose tool reports a different version, and says so', () => {
    const registry = freshLab();
    runNative(registry, { record: true, env });
    const report = runNative(registry, {
      env: { ...env, FAKE_STRACE_VERSION: '6.8' },
    });
    const trace = report.drift.find((d) => d.file === 'out/trace.txt')!;
    expect(trace.status).toBe('skipped');
    expect(trace.reason).toContain(
      'strace {"version":"strace -- version 6.8"}',
    );
    // The C program's own output does not depend on strace.
    expect(report.drift.find((d) => d.file === 'out/output.txt')?.status).toBe(
      'same',
    );
  });

  it('skips everything that needs an absent tool and keeps its recorded version', () => {
    const registry = freshLab();
    runNative(registry, { record: true, env });
    const withoutGo = { ...env, ANVAYA_GO: undefined };
    const report = runNative(registry, { env: withoutGo });
    const reason = 'go is absent (ANVAYA_GO is not set)';
    expect(report.drift.filter((d) => d.status === 'skipped')).toEqual([
      { file: 'out/escape.txt', status: 'skipped', reason },
      { file: 'out/go.txt', status: 'skipped', reason },
    ]);
    expect(report.skipped).toEqual([{ what: 'check fake.go', reason }]);
    // Recording without Go keeps Go's recorded identity.
    runNative(registry, { record: true, env: withoutGo });
    expect(JSON.parse(read('toolchain.json')).go).toEqual({
      version: 'go1.26.8 linux/amd64',
    });
  });

  it('validates measurements quickly and records them in full with provenance', () => {
    const registry = freshLab();
    const quick = runNative(registry, { env });
    expect(quick.measurements[0]).toMatchObject({
      file: 'out/measure.json',
      compiler: 'fakecc (Fake 1.0) 1.0',
      line: 'ran quick',
    });
    expect(quick.measurements[0]).not.toHaveProperty('kernel');
    expect(() => read('out/measure.json')).toThrow();

    runNative(registry, { recordMeasurements: true, only: 'measure', env });
    const recorded = JSON.parse(read('out/measure.json'));
    expect(recorded).toMatchObject({
      line: 'ran full',
      command: './measurement full',
      flags: ['-O2'],
      tools: { cc: { version: '(Fake 1.0) 1.0' } },
    });
    for (const key of ['date', 'kernel', 'cpu', 'hypervisor', 'wsl', 'root'])
      expect(recorded).toHaveProperty(key);
    // --only limits what is rewritten.
    expect(() => read('out/strace.json')).toThrow();

    runNative(registry, { recordMeasurements: true, env });
    expect(JSON.parse(read('out/strace.json'))).toMatchObject({
      lines: 5,
      summary: '100.00    0.000001           1         1           getpid',
      stdout: 'ran',
      command: 'strace -f -C -o strace.txt ./prog',
      tools: { strace: { version: 'strace -- version 6.19' } },
    });
  });

  it('names the tools each kind needs', () => {
    expect(
      toolsFor({
        kind: 'asm',
        compiler: 'arm64',
        source: 'a.c',
        flags: [],
        symbol: 'f',
        file: 'x',
      }),
    ).toEqual(['cc-arm64']);
    expect(toolsFor({ sources: ['a.c'], levels: ['-O2'] })).toEqual(['cc']);
    expect(
      toolsFor({
        kind: 'strace',
        program: { sources: [], flags: [] },
        file: 'x',
      }),
    ).toEqual(['cc', 'strace']);
  });
});

describe('trace and listing helpers', () => {
  it('replaces whole process IDs only', () => {
    expect(
      normalizeTrace('42 read(3, "42.5 4242", 9) = 42\n', '/tmp/none'),
    ).toBe('P1 read(3, "42.5 4242", 9) = P1\n');
    expect(() => normalizeTrace('1 getpid() = 1\n', '/x', 'openat')).toThrow(
      'The trace never shows openat',
    );
  });

  it('splits strace -C output into the trace and its summary', () => {
    const parts = splitSummary(
      '1 getpid() = 1\n% time     seconds  usecs/call\nrow\n',
    );
    expect(parts).toEqual({
      trace: '1 getpid() = 1\n',
      summary: '% time     seconds  usecs/call\nrow\n',
    });
    expect(splitSummary('only trace\n').summary).toBe('');
  });

  it('cuts one function from a GCC listing and an objdump block', () => {
    const assembly = [
      'f:',
      '\tret',
      '\t.size\tf, .-f',
      'g:',
      '\tret',
      '\t.size\tg, .-g',
      '',
    ].join('\n');
    expect(functionListing(assembly, 'g')).toBe('g:\n\tret\n\t.size\tg, .-g\n');
    expect(() => functionListing(assembly, 'h')).toThrow(
      'Expected a GCC listing for h',
    );
    const dump = '0000 <f>:\n  0: c3 ret\n\n0001 <g>:\n  1: c3 ret\n';
    expect(objdumpBlock(dump, 'g')).toBe('0001 <g>:\n  1: c3 ret\n\n');
  });
});

// The real toolchains, when their variables are set (docs/playbooks/verify-change.md).
describe.skipIf(!process.env.ANVAYA_JAVA_HOME)('with the real JDK', () => {
  it('compiles a class, runs it and lists its bytecode', () => {
    const registry = freshLab();
    writeFileSync(
      join(lab, 'Twice.java'),
      'public class Twice {\n  static int twice(int x) { return x * 2; }\n  public static void main(String[] a) { System.out.println(twice(21)); }\n}\n',
    );
    registry.checks = [
      { kind: 'java', sources: ['Twice.java'], mainClass: 'Twice' },
    ];
    registry.artifacts = [
      {
        kind: 'javap',
        sources: ['Twice.java'],
        className: 'Twice',
        file: 'twice.txt',
      },
      {
        kind: 'java-output',
        sources: ['Twice.java'],
        mainClass: 'Twice',
        file: 'out.txt',
      },
    ];
    registry.measurements = [];
    const report = runNative(registry, { record: true });
    expect(report.checked).toEqual(['Twice.java (java)']);
    expect(read('out.txt')).toBe('42\n');
    expect(read('twice.txt')).toContain('Compiled from "Twice.java"');
    expect(read('twice.txt')).toContain('imul');
  }, 120_000);
});

describe.skipIf(!process.env.ANVAYA_GO)('with the real Go toolchain', () => {
  it('runs a program and reports its escape analysis', () => {
    const registry = freshLab();
    writeFileSync(
      join(lab, 'escape.go'),
      'package main\n\nimport "fmt"\n\nfunc leak() *int { x := 42; return &x }\n\nfunc main() { fmt.Println(*leak()) }\n',
    );
    registry.checks = [{ kind: 'go', source: 'escape.go' }];
    registry.artifacts = [
      { kind: 'go-escape', source: 'escape.go', file: 'escape.txt' },
      { kind: 'go-output', source: 'escape.go', file: 'out.txt' },
    ];
    registry.measurements = [];
    runNative(registry, { record: true });
    expect(read('out.txt')).toBe('42\n');
    expect(read('escape.txt')).toContain('./escape.go:5:20: moved to heap: x');
  }, 300_000);
});

describe.skipIf(!process.env.ANVAYA_STRACE || !process.env.ANVAYA_CC)(
  'with real strace',
  () => {
    it('traces a C program from a marker with stable process IDs', () => {
      const registry = freshLab();
      writeFileSync(
        join(lab, 'pid.c'),
        '#include <stdio.h>\n#include <unistd.h>\nint main(void) { printf("%d\\n", (int)getpid()); return 0; }\n',
      );
      registry.checks = [];
      registry.artifacts = [
        {
          kind: 'strace',
          program: { sources: ['pid.c'], flags: ['-O2'] },
          options: ['-e', 'trace=getpid,write,exit_group'],
          from: 'getpid',
          file: 'pid.txt',
        },
      ];
      registry.measurements = [];
      runNative(registry, { record: true });
      const lines = read('pid.txt').trim().split('\n');
      expect(lines[0]).toMatch(/^P1 getpid\(\)\s+= P1$/);
      expect(lines).toContain('P1 +++ exited with 0 +++');
    }, 120_000);
  },
);
