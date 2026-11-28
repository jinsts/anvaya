/**
 * The processes lesson's model: how fork, exec, exit and wait create,
 * transform, end and reap processes, and what becomes of children whose
 * parent never reaps them.
 *
 * A program is a list of actions run by its first process, P1:
 *
 *   { fork: [...] }            create a child that runs the listed actions and
 *                              then exits with status 0 (like
 *                              `if (fork() == 0) { ...; _exit(0); }`)
 *   { exec: 'serve', exits }   replace this process's program with one that
 *                              exits with status `exits`; nothing after it
 *                              runs. Without `exits` the program is missing:
 *                              exec fails and the process continues.
 *   { wait: true }             waitpid for this process's oldest child not yet
 *                              reaped: block until it exits, then reap it. With
 *                              no such child, return at once (ECHILD).
 *   { exit: n }                end now with status n, 0–255.
 *   { pause: true }            block forever, like a server that never waits.
 *
 * Children are named P2, P3 … in the order their fork actions appear in the
 * program, reading a fork's own actions before what follows it and counting
 * only forks that run. With these rules the outcome does not depend on which
 * process the scheduler runs first. A child whose parent exits is adopted by
 * init, which reaps it when it exits; subreapers are left to the lesson.
 */

export type Action =
  | { fork: Action[] }
  | { exec: string; exits?: number }
  | { wait: true }
  | { exit: number }
  | { pause: true };

/** How a process's life ended, or that it has not. */
export type End = 'reaped by parent' | 'reaped by init' | 'zombie' | 'running';

export interface ProcessResult {
  name: string;
  /** The process that forked it; null for P1. */
  parent: string | null;
  /** The program it ends up running: 'program' unless an exec succeeded. */
  image: string;
  /** Its exit status, or null while it runs or blocks. */
  status: number | null;
  end: End;
}

/** A process's state at one moment, for the stepper. */
export type State = 'running' | 'waiting' | 'paused' | 'zombie' | 'reaped';
export interface Snapshot {
  name: string;
  /** The current parent: its creator, or init after adoption. */
  parent: string | null;
  image: string;
  state: State;
}
export interface Event {
  process: string;
  kind:
    | 'fork'
    | 'exec'
    | 'exec failed'
    | 'exit'
    | 'wait'
    | 'no child'
    | 'reap'
    | 'adopt'
    | 'pause';
  text: string;
  after: Snapshot[];
}

function status(value: unknown, what: string): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > 255
  )
    throw new RangeError(`${what} must be an integer from 0 to 255`);
  return value as number;
}

/** Validates a program and numbers its fork actions in reading order. */
function number(program: readonly Action[], order: Map<object, number>): void {
  for (const action of program) {
    if ('fork' in action && Array.isArray(action.fork)) {
      order.set(action, order.size);
      number(action.fork, order);
    } else if (
      'exec' in action &&
      typeof action.exec === 'string' &&
      action.exec !== ''
    ) {
      if (action.exits !== undefined)
        status(action.exits, 'An exec’s exit status');
    } else if ('exit' in action) status(action.exit, 'An exit status');
    else if (
      !('wait' in action && action.wait === true) &&
      !('pause' in action && action.pause === true)
    )
      throw new TypeError(`Not an action: ${JSON.stringify(action)}`);
  }
}

interface Process {
  id: number;
  node: object | null;
  creator: number | null;
  adopted: boolean;
  image: string;
  actions: Action[];
  state: 'ready' | 'waiting' | 'paused' | 'exited';
  waitingFor: Process | null;
  status: number | null;
  reapedBy: 'parent' | 'init' | null;
  children: Process[];
}

/** Runs a program to the point where no process can make progress. */
export function simulate(program: readonly Action[]): {
  processes: ProcessResult[];
  events: Event[];
} {
  const order = new Map<object, number>();
  number(program, order);
  const all: Process[] = [];
  const make = (
    node: object | null,
    creator: Process | null,
    actions: Action[],
  ): Process => {
    const process: Process = {
      id: all.length,
      node,
      creator: creator?.id ?? null,
      adopted: false,
      image: 'program',
      actions: [...actions],
      state: 'ready',
      waitingFor: null,
      status: null,
      reapedBy: null,
      children: [],
    };
    all.push(process);
    creator?.children.push(process);
    return process;
  };
  make(null, null, [...program]);

  // Names follow reading order, so they never depend on the scheduler.
  const name = (p: Process) =>
    p.node === null
      ? 'P1'
      : `P${
          2 +
          all.filter(
            (q) => q.node !== null && order.get(q.node)! < order.get(p.node!)!,
          ).length
        }`;
  const events: Event[] = [];
  const snapshot = (): Snapshot[] =>
    [...all]
      .sort((a, b) =>
        a.node === null
          ? -1
          : b.node === null
            ? 1
            : order.get(a.node)! - order.get(b.node)!,
      )
      .map((p) => ({
        name: name(p),
        parent:
          p.creator === null
            ? null
            : p.adopted
              ? 'init'
              : name(all[p.creator]!),
        image: p.image,
        state:
          p.state === 'exited'
            ? p.reapedBy
              ? 'reaped'
              : 'zombie'
            : p.state === 'waiting'
              ? 'waiting'
              : p.state === 'paused'
                ? 'paused'
                : 'running',
      }));
  const log = (p: Process, kind: Event['kind'], text: string) =>
    events.push({ process: name(p), kind, text, after: snapshot() });

  const exit = (p: Process, code: number) => {
    p.state = 'exited';
    p.status = code;
    // init reaps an adopted child at once; the shell that started P1 reaps it.
    if (p.adopted) p.reapedBy = 'init';
    if (p.creator === null) p.reapedBy = 'parent';
    log(
      p,
      'exit',
      `${name(p)} exits with status ${code}${p.adopted ? '; init reaps it' : p.creator === null ? '' : ` and stays a zombie until ${name(all[p.creator]!)} waits`}`,
    );
    for (const child of p.children)
      if (child.reapedBy === null) {
        child.adopted = true;
        if (child.state === 'exited') child.reapedBy = 'init';
        log(
          child,
          'adopt',
          `${name(child)} is adopted by init${child.reapedBy ? ', which reaps it' : ''}`,
        );
      }
  };

  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const p of [...all]) {
      if (p.state === 'exited' || p.state === 'paused') continue;
      if (p.state === 'waiting') {
        const child = p.waitingFor!;
        if (child.state !== 'exited') continue;
        child.reapedBy = 'parent';
        p.state = 'ready';
        p.waitingFor = null;
        log(
          p,
          'reap',
          `${name(p)} reaps ${name(child)}, status ${child.status}`,
        );
        progressed = true;
        continue;
      }
      progressed = true;
      const action = p.actions.shift();
      if (action === undefined) exit(p, 0);
      else if ('fork' in action) {
        const child = make(action, p, [...action.fork]);
        log(p, 'fork', `${name(p)} forks ${name(child)}`);
      } else if ('exec' in action) {
        if (action.exits === undefined) {
          log(
            p,
            'exec failed',
            `${name(p)} cannot exec ${action.exec}: not found, so it continues`,
          );
        } else {
          p.image = action.exec;
          p.actions = [{ exit: action.exits }];
          log(
            p,
            'exec',
            `${name(p)} execs ${action.exec}; its PID stays, its old program is gone`,
          );
        }
      } else if ('wait' in action) {
        const child = p.children.find((c) => c.reapedBy === null && !c.adopted);
        if (!child)
          log(p, 'no child', `${name(p)} waits, but has no child left to reap`);
        else {
          p.state = 'waiting';
          p.waitingFor = child;
          log(p, 'wait', `${name(p)} waits for ${name(child)}`);
        }
      } else if ('exit' in action) exit(p, action.exit);
      else {
        p.state = 'paused';
        log(p, 'pause', `${name(p)} pauses and never waits again`);
      }
    }
  }

  const processes = [...all]
    .sort((a, b) =>
      a.node === null
        ? -1
        : b.node === null
          ? 1
          : order.get(a.node)! - order.get(b.node)!,
    )
    .map((p): ProcessResult => ({
      name: name(p),
      parent: p.creator === null ? null : name(all[p.creator]!),
      image: p.image,
      status: p.state === 'exited' ? p.status : null,
      end:
        p.state !== 'exited'
          ? 'running'
          : p.creator === null || p.reapedBy === 'parent'
            ? 'reaped by parent'
            : p.reapedBy === 'init' || p.adopted
              ? 'reaped by init'
              : 'zombie',
    }));
  return { processes, events };
}

/** The lesson's launcher, the same steps as launcher.c without its subreaper. */
export const LAUNCHER: Action[] = [
  { fork: [{ exec: 'serve', exits: 0 }] },
  { wait: true },
  { fork: [{ exec: 'missing' }, { exit: 127 }] },
  { wait: true },
  { fork: [{ fork: [{ exit: 0 }] }, { exit: 0 }] },
  { wait: true },
];

/** The lifecycle the state diagram draws: from, event, to. */
export const LIFECYCLE = [
  { from: 'parent', event: 'fork', to: 'running' },
  { from: 'running', event: 'exec', to: 'running' },
  { from: 'running', event: 'exit', to: 'zombie' },
  { from: 'zombie', event: 'parent waits', to: 'reaped' },
  {
    from: 'zombie',
    event: 'parent exits: init adopts and waits',
    to: 'reaped',
  },
] as const;

/** The lesson's verified output. */
export function processesExample(): string {
  const { processes } = simulate(LAUNCHER);
  const done = processes.map(
    (p) => `${p.name} ${p.image} status ${p.status ?? '-'}: ${p.end}`,
  );
  const paused = simulate([{ fork: [{ exit: 3 }] }, { pause: true }]).processes;
  return [
    ...done,
    `with a parent that never waits: ${paused.map((p) => `${p.name} ${p.end}`).join(', ')}`,
  ].join('\n');
}
