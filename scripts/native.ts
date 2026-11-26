// The shared native runner (docs/adr/0010-shared-native-runner.md).
//
// A subject's native lab registers its checked programs, deterministic
// artifacts and measurements in a registry and calls `main(registry)`. The
// runner builds and runs them in a temporary folder that it always removes,
// with the toolchains these variables name:
//
//   ANVAYA_CC         GCC 15.2 for x86-64; ANVAYA_BINUTILS names the folder
//                     holding its objdump and nm (default: PATH)
//   ANVAYA_CC_ARM64   GCC 15.2 targeting aarch64, for -S listings only
//   ANVAYA_STRACE     strace 6.19
//   ANVAYA_JAVA_HOME  OpenJDK 21, with bin/javac, bin/java and bin/javap
//   ANVAYA_GO         the go command of Go 1.26
//   ANVAYA_DOCKER     a Docker command line whose daemon answers
//   ANVAYA_ENVIRONMENT  optional words describing the machine, recorded with
//                     each measurement (for example "WSL2 on the owner's laptop")
//
// A tool that is unset or does not run is absent: everything that needs it is
// reported as skipped, with the reason. An artifact is compared with its
// committed copy only when every tool it needs reports the version recorded
// in the subject's toolchain.json; otherwise it is skipped. Checked programs
// run whenever their tools are present, so their assertions execute.
// Measurements run in quick mode to validate their output; timings are never
// compared or thresholded.
//
//   --record                 rewrite the artifacts and the toolchain record
//   --record-measurements    run measurements in full and rewrite their files
//   --only <text>            limit recorded measurements to files containing text
import {
  execFileSync,
  spawnSync,
  type SpawnSyncReturns,
} from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { arch, cpus, platform, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

export type Tool = 'cc' | 'cc-arm64' | 'strace' | 'java' | 'go' | 'docker';

/** What a tool reports about itself; drift checks compare these fields. */
export type Identity = Record<string, string | null>;

export interface ToolInfo {
  tool: Tool;
  status: 'present' | 'absent';
  /** The command or folder that was used. */
  path?: string;
  identity?: Identity;
  reason?: string;
}

/** The recorded identities, one per tool, as stored in toolchain.json. */
export type Toolchain = Partial<Record<Tool, Identity>>;

/** A path relative to the subject's lab folder, such as `system-calls/x.c`. */
type Source = string;

interface ArtifactBase {
  /** Where the committed copy lives, relative to the subject's lab folder. */
  file: string;
}
/** A program built with ANVAYA_CC from one or more C sources. */
export interface CProgram {
  sources: Source[];
  flags: string[];
}

export type Artifact = ArtifactBase &
  (
    | {
        // One function's GCC listing, through its .size directive.
        kind: 'asm';
        compiler?: 'arm64';
        source: Source;
        flags: string[];
        symbol: string;
      }
    | { kind: 'undefined-symbols'; source: Source; flags: string[] }
    | { kind: 'vec-report'; source: Source; flags: string[] }
    | {
        kind: 'object-disassembly';
        source: Source;
        flags: string[];
        symbol: string;
      }
    | {
        kind: 'linked-disassembly';
        sources: Source[];
        flags: string[];
        symbols: string[];
      }
    | {
        // A C program's standard output.
        kind: 'output';
        source?: Source;
        sources?: Source[];
        flags: string[];
        args?: string[];
        files?: Record<string, string>;
        /** Other C programs built into its working folder under these names. */
        programs?: Record<string, CProgram>;
      }
    | {
        // A normalized strace of a C program (see normalizeTrace).
        kind: 'strace';
        program: CProgram;
        args?: string[];
        /** Files created in the program's working folder before it runs. */
        files?: Record<string, string>;
        /** strace options before `-o`; `-f` is always given. */
        options?: string[];
        /** Keep the trace from the first line containing this text. */
        from?: string;
        /** The exit status the program must end with (default 0). */
        status?: number;
      }
    | {
        // javap's listing of one compiled class.
        kind: 'javap';
        sources: Source[];
        className: string;
        options?: string[];
      }
    | {
        kind: 'java-output';
        sources: Source[];
        mainClass: string;
        args?: string[];
      }
    | {
        // The compiler's escape-analysis report: go build -gcflags=-m.
        kind: 'go-escape';
        source: Source;
      }
    | { kind: 'go-output'; source: Source; args?: string[] }
    | {
        // A container's standard output; containers always run unprivileged.
        kind: 'docker-output';
        image: string;
        command: string[];
        options?: string[];
      }
  );

/** Programs whose own assertions must pass; they produce no artifact. */
export type Check =
  | {
      kind?: 'c';
      sources: Source[];
      levels: string[];
      flags?: string[];
      args?: string[];
    }
  | { kind: 'java'; sources: Source[]; mainClass: string; args?: string[] }
  | { kind: 'go'; source: Source; args?: string[] };

/** What an strace measurement hands to its parser. */
export interface StraceRecording {
  /** The trace, with the temporary folder replaced by `.`. */
  trace: string;
  /** strace's summary table, when -C or -c was given. */
  summary: string;
  /** The traced program's standard output. */
  stdout: string;
}
interface MeasurementBase {
  file: string;
  /** Arguments for the quick validating run and for the recorded run. */
  args?: { quick: string[]; full: string[] };
}
export type Measurement = MeasurementBase &
  (
    | {
        kind?: 'c';
        source: Source;
        flags: string[];
        parse(stdout: string): unknown;
      }
    | {
        // One harness linked with several builds of a kernel.
        kind: 'c-variants';
        harness: Source;
        kernel: Source;
        variants: { label: string; flags: string[] }[];
        parse(stdout: string): unknown;
      }
    | {
        // strace of a C program, run with the quick or full arguments.
        kind: 'strace';
        program: CProgram;
        files?: Record<string, string>;
        options: string[];
        parse(recording: StraceRecording): unknown;
      }
  );

export interface Registry {
  /** The subject's lab folder, labs/<subject>, as an absolute path. */
  root: string;
  /** The toolchain record, as an absolute path. */
  toolchainFile: string;
  checks?: Check[];
  artifacts?: Artifact[];
  measurements?: Measurement[];
}

export interface Options {
  record?: boolean;
  recordMeasurements?: boolean;
  only?: string | null;
  env?: NodeJS.ProcessEnv;
}

export interface Report {
  tools: Record<Tool, ToolInfo>;
  toolchain: Toolchain;
  checked: string[];
  skipped: { what: string; reason: string }[];
  drift: {
    file: string;
    status: 'same' | 'changed' | 'skipped' | 'recorded';
    reason?: string;
  }[];
  measurements: ({ file: string } & Record<string, unknown>)[];
}

const TOOLS: Tool[] = ['cc', 'cc-arm64', 'strace', 'java', 'go', 'docker'];
const VARIABLE: Record<Tool, string> = {
  cc: 'ANVAYA_CC',
  'cc-arm64': 'ANVAYA_CC_ARM64',
  strace: 'ANVAYA_STRACE',
  java: 'ANVAYA_JAVA_HOME',
  go: 'ANVAYA_GO',
  docker: 'ANVAYA_DOCKER',
};

/** The tools an artifact, check or measurement needs. */
export function toolsFor(entry: Artifact | Check | Measurement): Tool[] {
  switch (entry.kind) {
    case 'asm':
      return [entry.compiler === 'arm64' ? 'cc-arm64' : 'cc'];
    case 'strace':
      return ['cc', 'strace'];
    case 'javap':
    case 'java-output':
    case 'java':
      return ['java'];
    case 'go-escape':
    case 'go-output':
    case 'go':
      return ['go'];
    case 'docker-output':
      return ['docker'];
    default:
      return ['cc'];
  }
}

/** Options that change the JVM's behaviour or output, removed for every run. */
const JAVA_NOISE = ['JAVA_TOOL_OPTIONS', '_JAVA_OPTIONS', 'JDK_JAVA_OPTIONS'];

function firstLine(text: string): string {
  return text.split('\n')[0]?.trim() ?? '';
}

function attempt(
  file: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): SpawnSyncReturns<string> {
  return spawnSync(file, args, { encoding: 'utf8', env, timeout: 60_000 });
}

/** Finds each tool from its variable and asks it what it is. */
export function detectTools(
  env: NodeJS.ProcessEnv = process.env,
): Record<Tool, ToolInfo> {
  const found = {} as Record<Tool, ToolInfo>;
  const javaEnv = { ...env };
  for (const name of JAVA_NOISE) delete javaEnv[name];
  for (const tool of TOOLS) {
    const path = env[VARIABLE[tool]];
    const absent = (reason: string): ToolInfo => ({
      tool,
      status: 'absent',
      reason,
      ...(path ? { path } : {}),
    });
    if (!path) {
      found[tool] = absent(`${VARIABLE[tool]} is not set`);
      continue;
    }
    try {
      if (tool === 'cc' || tool === 'cc-arm64') {
        const version = attempt(path, ['--version'], env);
        if (version.status !== 0) throw new Error(`${path} --version failed`);
        const identity: Identity = {
          // Version text without the program name, e.g. "(Ubuntu 15.2.0-16ubuntu1) 15.2.0".
          version: firstLine(version.stdout).replace(/^\S+\s+/, ''),
          target: attempt(path, ['-dumpmachine'], env).stdout.trim(),
        };
        if (tool === 'cc') {
          // objdump and nm come from ANVAYA_BINUTILS, or from PATH.
          const objdump = binutil('objdump', env);
          const result = attempt(objdump, ['--version'], env);
          identity.binutils =
            result.status === 0 ? firstLine(result.stdout) : null;
        }
        found[tool] = { tool, status: 'present', path, identity };
      } else if (tool === 'strace') {
        const version = attempt(path, ['-V'], env);
        if (version.status !== 0) throw new Error(`${path} -V failed`);
        // Tracing needs ptrace, which a container or Yama can forbid.
        const probe = attempt(path, ['-o', '/dev/null', 'true'], env);
        if (probe.status !== 0)
          throw new Error(
            `strace cannot trace here: ${firstLine(probe.stderr)}`,
          );
        found[tool] = {
          tool,
          status: 'present',
          path,
          identity: { version: firstLine(version.stdout) },
        };
      } else if (tool === 'java') {
        const javac = join(path, 'bin', 'javac');
        const version = attempt(javac, ['-version'], javaEnv);
        if (version.status !== 0) throw new Error(`${javac} -version failed`);
        const runtime = attempt(
          join(path, 'bin', 'java'),
          ['-version'],
          javaEnv,
        );
        found[tool] = {
          tool,
          status: 'present',
          path,
          identity: {
            version: firstLine(version.stdout || version.stderr),
            runtime: runtime.status === 0 ? firstLine(runtime.stderr) : null,
          },
        };
      } else if (tool === 'go') {
        const version = attempt(path, ['version'], {
          ...env,
          GOTOOLCHAIN: 'local',
        });
        if (version.status !== 0) throw new Error(`${path} version failed`);
        found[tool] = {
          tool,
          status: 'present',
          path,
          identity: {
            version: firstLine(version.stdout).replace(/^go version /, ''),
          },
        };
      } else {
        const version = attempt(
          path,
          ['version', '--format', '{{.Server.Version}}'],
          env,
        );
        if (version.status !== 0)
          throw new Error(
            `the Docker daemon does not answer: ${firstLine(version.stderr)}`,
          );
        found[tool] = {
          tool,
          status: 'present',
          path,
          identity: { version: version.stdout.trim() },
        };
      }
    } catch (error) {
      found[tool] = absent((error as Error).message);
    }
  }
  return found;
}

function binutil(name: 'objdump' | 'nm', env: NodeJS.ProcessEnv): string {
  return env.ANVAYA_BINUTILS ? join(env.ANVAYA_BINUTILS, name) : name;
}

/** Lines of one function from GCC's assembly output, through its .size directive. */
export function functionListing(assembly: string, symbol: string): string {
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
export function objdumpBlock(text: string, symbol: string): string {
  const start = text.indexOf(`<${symbol}>:\n`);
  if (start < 0) throw new Error(`objdump shows no ${symbol}`);
  const lineStart = text.lastIndexOf('\n', start) + 1;
  const end = text.indexOf('\n\n', start);
  return text.slice(lineStart, end < 0 ? undefined : end) + '\n';
}

/**
 * Makes an `strace -f -o` trace comparable across runs: each process ID
 * becomes P1, P2 … in order of first appearance, wherever it occurs as a
 * whole number, and the ID column becomes the label and one space whatever
 * the ID's length; the temporary folder becomes `.`; and with `from`, lines
 * before the first one containing that text are dropped.
 */
export function normalizeTrace(
  trace: string,
  folder: string,
  from?: string,
): string {
  let lines = trace.split('\n').filter((line) => line !== '');
  const pids: string[] = [];
  for (const line of lines) {
    const pid = line.match(/^(\d+)\s/)?.[1];
    if (pid && !pids.includes(pid)) pids.push(pid);
  }
  if (from !== undefined) {
    const start = lines.findIndex((line) => line.includes(from));
    if (start < 0) throw new Error(`The trace never shows ${from}`);
    lines = lines.slice(start);
  }
  return (
    lines
      .map((line) => {
        // strace pads the process ID column to five characters, so a
        // shorter ID leaves extra spaces; the label takes exactly one.
        const prefix = line.match(/^(\d+)\s+/);
        let text = prefix
          ? `P${pids.indexOf(prefix[1]!) + 1} ${line.slice(prefix[0].length)}`
          : line;
        text = text.split(folder).join('.');
        pids.forEach((pid, index) => {
          text = text.replace(
            new RegExp(`(?<![\\w.])${pid}(?![\\w.])`, 'g'),
            `P${index + 1}`,
          );
        });
        return text;
      })
      .join('\n') + '\n'
  );
}

/** Splits `strace -C` output into its trace lines and its summary table. */
export function splitSummary(text: string): { trace: string; summary: string } {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^% time\s+seconds/.test(line));
  if (start < 0) return { trace: text, summary: '' };
  return {
    trace: lines.slice(0, start).join('\n') + '\n',
    summary: lines.slice(start).join('\n').trimEnd() + '\n',
  };
}

function caches(): string | null {
  try {
    return execFileSync('lscpu', ['--caches'], { encoding: 'utf8' });
  } catch {
    return null;
  }
}

/** Where a measurement ran, beyond the tools: E4 and E5 provenance. */
function machine(env: NodeJS.ProcessEnv) {
  const read = (file: string) =>
    existsSync(file) ? readFileSync(file, 'utf8') : '';
  const lscpu = (() => {
    try {
      return execFileSync('lscpu', [], { encoding: 'utf8' });
    } catch {
      return '';
    }
  })();
  return {
    kernel: execFileSync('uname', ['-r'], { encoding: 'utf8' }).trim(),
    os:
      read('/etc/os-release').match(/^PRETTY_NAME="?([^"\n]*)"?$/m)?.[1] ??
      null,
    hypervisor:
      lscpu.match(/^Hypervisor vendor:\s*(.+)$/m)?.[1]?.trim() ?? null,
    wsl: /microsoft/i.test(read('/proc/version')),
    cpus: cpus().length,
    root: process.getuid?.() === 0,
    environment: env.ANVAYA_ENVIRONMENT ?? null,
  };
}

export function runNative(registry: Registry, options: Options = {}): Report {
  const env = options.env ?? process.env;
  const tools = detectTools(env);
  const toolchain: Toolchain = {};
  for (const info of Object.values(tools))
    if (info.status === 'present' && info.identity)
      toolchain[info.tool] = info.identity;
  const recorded: Toolchain = existsSync(registry.toolchainFile)
    ? JSON.parse(readFileSync(registry.toolchainFile, 'utf8'))
    : {};
  const report: Report = {
    tools,
    toolchain,
    checked: [],
    skipped: [],
    drift: [],
    measurements: [],
  };
  const root = registry.root;
  const missing = (needed: Tool[]) =>
    needed.filter((tool) => tools[tool].status !== 'present');
  const why = (needed: Tool[]) =>
    missing(needed)
      .map((tool) => `${tool} is absent (${tools[tool].reason})`)
      .join('; ');
  const differs = (needed: Tool[]) =>
    needed
      .filter((tool) => {
        const now = toolchain[tool];
        const then = recorded[tool];
        return (
          !then ||
          !now ||
          Object.keys(then).some(
            (key) => key !== 'runtime' && then[key] !== now[key],
          )
        );
      })
      .map(
        (tool) =>
          `${tool} ${JSON.stringify(toolchain[tool])} is not the recorded ${JSON.stringify(recorded[tool] ?? null)}`,
      )
      .join('; ');

  const temporary = mkdtempSync(join(tmpdir(), 'anvaya-native-'));
  let count = 0;
  const scratch = (name: string) => join(temporary, `${count++}-${name}`);
  const run = (
    file: string,
    args: string[],
    extra: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
  ) =>
    execFileSync(file, args, {
      encoding: 'utf8',
      maxBuffer: 64 << 20,
      env,
      ...extra,
    });
  const cc = () => tools.cc.path!;
  const javaEnv = () => {
    const clean = { ...env };
    for (const name of JAVA_NOISE) delete clean[name];
    return clean;
  };
  const goEnv = () => ({ ...env, GOTOOLCHAIN: 'local', GOFLAGS: '' });
  const at = (source: Source) => join(root, source);

  /** Builds a C program and returns the executable's path. */
  const buildC = (program: CProgram, name: string) => {
    const executable = scratch(name);
    run(cc(), [...program.flags, ...program.sources.map(at), '-o', executable]);
    return executable;
  };
  /** A folder holding the given files, for a program to run in. */
  const workspace = (files: Record<string, string> = {}) => {
    const folder = scratch('work');
    mkdirSync(folder);
    for (const [name, text] of Object.entries(files))
      writeFileSync(join(folder, name), text);
    return folder;
  };
  /**
   * Runs a C program under `strace -f -o` in a fresh folder holding `files`,
   * as ./<name of its first source>, and returns the trace and its output.
   */
  const traced = (
    program: CProgram,
    args: string[],
    files: Record<string, string> | undefined,
    extra: string[],
    status = 0,
  ) => {
    const folder = workspace(files);
    const name = basename(program.sources[0]!, '.c');
    const local = join(folder, name);
    writeFileSync(local, readFileSync(buildC(program, name)));
    chmodSync(local, 0o755);
    const out = join(folder, 'strace.txt');
    const result = spawnSync(
      tools.strace.path!,
      ['-f', ...extra, '-o', out, `./${name}`, ...args],
      {
        cwd: folder,
        encoding: 'utf8',
        env,
      },
    );
    // strace exits with the traced program's status.
    if (result.status !== status)
      throw new Error(
        `strace of ${program.sources[0]} exited with ${result.status}, not ${status}: ${result.stderr}`,
      );
    const text = readFileSync(out, 'utf8');
    rmSync(out);
    return { folder, text, stdout: result.stdout };
  };
  const javaBuild = (sources: Source[]) => {
    const classes = scratch('classes');
    mkdirSync(classes);
    run(
      join(tools.java.path!, 'bin', 'javac'),
      ['-d', classes, ...sources.map(at)],
      { env: javaEnv() },
    );
    return classes;
  };

  function generate(artifact: Artifact): string {
    switch (artifact.kind) {
      case 'asm': {
        const output = scratch('listing.s');
        const compiler =
          artifact.compiler === 'arm64' ? tools['cc-arm64'].path! : cc();
        run(compiler, [
          ...artifact.flags,
          '-S',
          at(artifact.source),
          '-o',
          output,
        ]);
        return functionListing(readFileSync(output, 'utf8'), artifact.symbol);
      }
      case 'undefined-symbols': {
        const output = scratch('object.o');
        run(cc(), [...artifact.flags, '-c', at(artifact.source), '-o', output]);
        return run(binutil('nm', env), ['-u', output]);
      }
      case 'vec-report': {
        // GCC's own account of which loops it vectorized. Run from the
        // subject folder so the report names the source by a relative path.
        const result = spawnSync(
          cc(),
          [
            ...artifact.flags,
            '-fopt-info-vec-optimized',
            '-c',
            artifact.source,
            '-o',
            scratch('object.o'),
          ],
          { cwd: root, encoding: 'utf8', env },
        );
        if (result.status !== 0) throw new Error(result.stderr);
        return result.stderr;
      }
      case 'object-disassembly': {
        const output = scratch('object.o');
        run(cc(), [...artifact.flags, '-c', at(artifact.source), '-o', output]);
        return objdumpBlock(
          run(binutil('objdump', env), ['-dr', output]),
          artifact.symbol,
        );
      }
      case 'linked-disassembly': {
        const output = scratch('linked');
        run(cc(), [
          ...artifact.flags,
          ...artifact.sources.map(at),
          '-o',
          output,
        ]);
        run(output, []);
        const disassembly = run(binutil('objdump', env), ['-d', output]);
        const symbols = run(binutil('nm', env), [output])
          .split('\n')
          .filter((line) =>
            artifact.symbols.some((s) => line.endsWith(` ${s}`)),
          )
          .sort();
        return (
          symbols.join('\n') +
          '\n\n' +
          artifact.symbols.map((s) => objdumpBlock(disassembly, s)).join('\n')
        );
      }
      case 'output': {
        const executable = buildC(
          {
            sources: artifact.sources ?? [artifact.source!],
            flags: artifact.flags,
          },
          'program',
        );
        const folder = workspace(artifact.files);
        for (const [name, program] of Object.entries(artifact.programs ?? {})) {
          const installed = join(folder, name);
          writeFileSync(installed, readFileSync(buildC(program, name)));
          chmodSync(installed, 0o755);
        }
        return run(executable, artifact.args ?? [], { cwd: folder });
      }
      case 'strace': {
        const { folder, text } = traced(
          artifact.program,
          artifact.args ?? [],
          artifact.files,
          artifact.options ?? [],
          artifact.status,
        );
        return normalizeTrace(text, folder, artifact.from);
      }
      case 'javap': {
        const classes = javaBuild(artifact.sources);
        const listing = run(
          join(tools.java.path!, 'bin', 'javap'),
          [...(artifact.options ?? ['-c']), '-cp', classes, artifact.className],
          { env: javaEnv() },
        );
        // javap names the source file without its folder.
        return listing;
      }
      case 'java-output': {
        const classes = javaBuild(artifact.sources);
        return run(
          join(tools.java.path!, 'bin', 'java'),
          ['-cp', classes, artifact.mainClass, ...(artifact.args ?? [])],
          {
            env: javaEnv(),
          },
        );
      }
      case 'go-escape': {
        const folder = workspace();
        const source = join(folder, basename(artifact.source));
        writeFileSync(source, readFileSync(at(artifact.source)));
        const result = spawnSync(
          tools.go.path!,
          ['build', '-gcflags=-m', '-o', scratch('go'), basename(source)],
          {
            cwd: folder,
            encoding: 'utf8',
            env: goEnv(),
          },
        );
        if (result.status !== 0) throw new Error(result.stderr);
        // The report starts with the package path and names files relatively.
        return result.stderr.split(folder).join('.');
      }
      case 'go-output': {
        const folder = workspace();
        writeFileSync(
          join(folder, basename(artifact.source)),
          readFileSync(at(artifact.source)),
        );
        return run(
          tools.go.path!,
          ['run', basename(artifact.source), ...(artifact.args ?? [])],
          {
            cwd: folder,
            env: goEnv(),
          },
        );
      }
      case 'docker-output':
        return run(tools.docker.path!, [
          'run',
          '--rm',
          '--network',
          'none',
          '--security-opt',
          'no-new-privileges',
          '--cap-drop',
          'ALL',
          ...(artifact.options ?? []),
          artifact.image,
          ...artifact.command,
        ]);
    }
  }

  try {
    for (const check of registry.checks ?? []) {
      const needed = toolsFor(check);
      const label =
        check.kind === 'go' ? check.source : check.sources.join(' + ');
      if (missing(needed).length) {
        report.skipped.push({ what: `check ${label}`, reason: why(needed) });
        continue;
      }
      if (check.kind === 'java') {
        const classes = javaBuild(check.sources);
        run(
          join(tools.java.path!, 'bin', 'java'),
          ['-cp', classes, check.mainClass, ...(check.args ?? [])],
          {
            env: javaEnv(),
          },
        );
        report.checked.push(`${label} (java)`);
      } else if (check.kind === 'go') {
        const folder = workspace();
        writeFileSync(
          join(folder, basename(check.source)),
          readFileSync(at(check.source)),
        );
        run(
          tools.go.path!,
          ['run', basename(check.source), ...(check.args ?? [])],
          { cwd: folder, env: goEnv() },
        );
        report.checked.push(`${label} (go)`);
      } else
        for (const level of check.levels) {
          const executable = scratch('checked');
          run(cc(), [
            level,
            '-fno-inline',
            ...(check.flags ?? []),
            ...check.sources.map(at),
            '-o',
            executable,
          ]);
          run(executable, check.args ?? []);
          report.checked.push(`${label} ${level}`);
        }
    }

    for (const artifact of registry.artifacts ?? []) {
      const needed = toolsFor(artifact);
      if (missing(needed).length) {
        report.drift.push({
          file: artifact.file,
          status: 'skipped',
          reason: why(needed),
        });
        continue;
      }
      const text = generate(artifact);
      const file = join(root, artifact.file);
      const mismatch = differs(needed);
      if (options.record) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, text);
        report.drift.push({ file: artifact.file, status: 'recorded' });
      } else if (mismatch)
        report.drift.push({
          file: artifact.file,
          status: 'skipped',
          reason: mismatch,
        });
      else
        report.drift.push({
          file: artifact.file,
          status:
            existsSync(file) && readFileSync(file, 'utf8') === text
              ? 'same'
              : 'changed',
        });
    }

    for (const measurement of registry.measurements ?? []) {
      const needed = toolsFor(measurement);
      if (missing(needed).length) {
        report.skipped.push({
          what: `measurement ${measurement.file}`,
          reason: why(needed),
        });
        continue;
      }
      const recordThis =
        !!options.recordMeasurements &&
        (!options.only || measurement.file.includes(options.only));
      const args = measurement.args
        ? recordThis
          ? measurement.args.full
          : measurement.args.quick
        : [];
      let data: unknown;
      let command: string;
      let flags: string[];
      if (measurement.kind === 'c-variants') {
        // The harness is built at -O2; only the kernel's flags vary.
        const harness = scratch('harness.o');
        run(cc(), ['-O2', '-c', at(measurement.harness), '-o', harness]);
        const variants = [];
        for (const variant of measurement.variants) {
          const kernel = scratch(`kernel-${variant.label}.o`);
          const executable = scratch('measurement');
          run(cc(), [
            ...variant.flags,
            '-c',
            at(measurement.kernel),
            '-o',
            kernel,
          ]);
          run(cc(), [harness, kernel, '-o', executable]);
          variants.push({
            ...variant,
            records: measurement.parse(run(executable, args)),
          });
        }
        data = { variants };
        command = ['./measurement', ...args].join(' ');
        flags = ['-O2 (harness)'];
      } else if (measurement.kind === 'strace') {
        const { folder, text, stdout } = traced(
          measurement.program,
          args,
          measurement.files,
          measurement.options,
        );
        const { trace, summary } = splitSummary(text);
        data = measurement.parse({
          trace: trace.split(folder).join('.'),
          summary,
          stdout,
        });
        const name = basename(measurement.program.sources[0]!, '.c');
        command = [
          'strace',
          '-f',
          ...measurement.options,
          '-o',
          'strace.txt',
          `./${name}`,
          ...args,
        ].join(' ');
        flags = measurement.program.flags;
      } else {
        const name = basename(measurement.source, '.c');
        const executable = scratch(name);
        run(cc(), [
          ...measurement.flags,
          at(measurement.source),
          '-o',
          executable,
        ]);
        data = measurement.parse(run(executable, args));
        command = [`./${name}`, ...args].join(' ');
        flags = measurement.flags;
      }
      const result = {
        date: new Date().toISOString(),
        compiler: firstLine(run(cc(), ['--version'])),
        target: toolchain.cc?.target ?? null,
        platform: platform(),
        arch: arch(),
        cpu: cpus()[0]?.model ?? null,
        caches: caches(),
        flags,
        ...(recordThis
          ? {
              ...machine(env),
              command,
              tools: Object.fromEntries(
                needed.map((tool) => [tool, toolchain[tool]]),
              ),
            }
          : {}),
        ...(data as object),
      };
      if (recordThis) {
        const file = join(root, measurement.file);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
      }
      report.measurements.push({ file: measurement.file, ...result });
    }

    if (options.record) {
      // Keep the recorded identity of any tool that was absent this time.
      const merged = { ...recorded, ...toolchain };
      writeFileSync(
        registry.toolchainFile,
        JSON.stringify(merged, null, 2) + '\n',
      );
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  return report;
}

/** Runs a subject's registry from the command line and prints the report. */
export function main(
  registry: Registry,
  argv: string[] = process.argv.slice(2),
): void {
  const onlyIndex = argv.indexOf('--only');
  const report = runNative(registry, {
    record: argv.includes('--record'),
    recordMeasurements: argv.includes('--record-measurements'),
    only: onlyIndex >= 0 ? (argv[onlyIndex + 1] ?? null) : null,
  });
  console.log(JSON.stringify(report, null, 2));
  const changed = report.drift.filter((d) => d.status === 'changed');
  if (changed.length) {
    console.error(
      `Regenerated artifacts differ from the committed copies: ${changed
        .map((d) => d.file)
        .join(', ')}. Review the change, then rerun with --record.`,
    );
    process.exitCode = 1;
  }
}
