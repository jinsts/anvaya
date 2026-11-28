/**
 * The scheduling lesson's model: a weighted fair scheduler on one CPU, in
 * the style of Linux's CFS as OSTEP chapter 9 describes it.
 *
 * - Each task has a nice value; its weight comes from the kernel's table
 *   (1024 at nice 0, about 1.25 times less for each step up).
 * - Running for a millisecond adds 1 ms × 1024 / weight to the task's
 *   virtual runtime (vruntime), so a light task's vruntime grows faster.
 * - The scheduler decides when the running task's slice of `quantum`
 *   milliseconds ends, or when it goes to sleep. It picks the runnable task
 *   with the lowest vruntime; on a tie, the one that has waited longest,
 *   then the one listed first.
 * - A task that wakes up takes the larger of its own vruntime and the lowest
 *   vruntime among the runnable tasks, so it can neither monopolize the CPU
 *   to catch up nor be pushed to the back.
 *
 * Time moves in whole milliseconds and vruntime in whole nanoseconds,
 * rounded down. Linux 6.6 and later run EEVDF, which keeps virtual runtime
 * and weights but also decides when a task wakes; the model leaves that out.
 */

/** Weights for nice -20 to 19 (OSTEP chapter 9, the kernel's table). */
export const WEIGHTS: readonly number[] = [
  88761, 71755, 56483, 46273, 36291, 29154, 23254, 18705, 14949, 11916, 9548,
  7620, 6100, 4904, 3906, 3121, 2501, 1991, 1586, 1277, 1024, 820, 655, 526,
  423, 335, 272, 215, 172, 137, 110, 87, 70, 56, 45, 36, 29, 23, 18, 15,
];

export interface Task {
  name: string;
  /** -20 (most CPU) to 19 (least); 0 by default. */
  nice?: number;
  /** A task that sleeps: milliseconds it runs before each sleep. */
  run?: number;
  /** …and milliseconds each sleep lasts. Omit both for a busy task. */
  sleep?: number;
}

export interface Candidate {
  name: string;
  /** Virtual runtime in nanoseconds. */
  vruntime: number;
}

export interface Decision {
  /** Millisecond at which the decision is made. */
  time: number;
  reason: 'start' | 'slice ended' | 'went to sleep' | 'woke up' | 'idle';
  /** Tasks that woke at this millisecond, with their placed vruntime. */
  woke: string[];
  /** Runnable tasks, lowest vruntime first, as the decision saw them. */
  candidates: Candidate[];
  /** The task picked, or null when nothing is runnable. */
  picked: string | null;
}

export interface Schedule {
  /** One entry per millisecond: the task that ran, or null when idle. */
  timeline: (string | null)[];
  decisions: Decision[];
  /** Milliseconds of CPU each task received. */
  cpu: Record<string, number>;
  /** For each task that sleeps, milliseconds from each wake-up to its run. */
  waits: Record<string, number[]>;
}

export interface Solution {
  /** Who ran, in order, with consecutive milliseconds merged; null = idle. */
  order: (string | null)[];
  cpu: Record<string, number>;
}

const MS = 1_000_000;

export function weightOf(nice: number): number {
  if (!Number.isInteger(nice) || nice < -20 || nice > 19)
    throw new RangeError(`nice ${nice} is not an integer from -20 to 19`);
  return WEIGHTS[nice + 20]!;
}

function positive(value: number, what: string) {
  if (!Number.isInteger(value) || value < 1)
    throw new RangeError(`${what} ${value} is not a positive integer`);
}

interface State {
  name: string;
  weight: number;
  run: number;
  sleep: number;
  vruntime: number;
  runnable: boolean;
  wakeAt: number;
  left: number;
  lastRan: number;
  index: number;
  cpu: number;
}

/** Runs `tasks` on one CPU for `duration` milliseconds. */
export function simulate(
  tasks: readonly Task[],
  quantum: number,
  duration: number,
): Schedule {
  positive(quantum, 'quantum');
  positive(duration, 'duration');
  if (!Array.isArray(tasks) || tasks.length === 0)
    throw new TypeError('tasks must be a non-empty array');
  const seen = new Set<string>();
  const states: State[] = tasks.map((task, index) => {
    if (typeof task?.name !== 'string' || task.name === '')
      throw new TypeError('every task needs a name');
    if (seen.has(task.name))
      throw new RangeError(`two tasks are named ${task.name}`);
    seen.add(task.name);
    const weight = weightOf(task.nice ?? 0);
    const sleeps = task.run !== undefined || task.sleep !== undefined;
    if (sleeps) {
      positive(task.run ?? NaN, `${task.name}'s run`);
      positive(task.sleep ?? NaN, `${task.name}'s sleep`);
    }
    return {
      name: task.name,
      weight,
      run: sleeps ? task.run! : Infinity,
      sleep: sleeps ? task.sleep! : 0,
      vruntime: 0,
      runnable: true,
      wakeAt: -1,
      left: sleeps ? task.run! : Infinity,
      lastRan: -1,
      index,
      cpu: 0,
    };
  });

  const timeline: (string | null)[] = [];
  const decisions: Decision[] = [];
  const waits: Record<string, number[]> = {};
  for (const s of states) if (s.run !== Infinity) waits[s.name] = [];
  const wokeAt = new Map<string, number>();
  let current: State | null = null;
  let used = 0;
  // Why the next millisecond must decide, if it must.
  let due: Decision['reason'] | null = 'start';

  const order = (a: State, b: State) =>
    a.vruntime - b.vruntime || a.lastRan - b.lastRan || a.index - b.index;

  for (let time = 0; time < duration; ++time) {
    // Wake every task whose sleep ends now, no earlier than the lowest
    // vruntime among the tasks already runnable.
    const woke = states.filter((s) => !s.runnable && s.wakeAt === time);
    const floor = Math.min(
      ...states.filter((s) => s.runnable).map((s) => s.vruntime),
    );
    for (const s of woke) {
      if (Number.isFinite(floor)) s.vruntime = Math.max(s.vruntime, floor);
      s.runnable = true;
      s.left = s.run;
      wokeAt.set(s.name, time);
    }
    if (!current && !due && woke.length > 0) due = 'woke up';
    if (current && used === quantum) due = 'slice ended';

    if (due) {
      const runnable = states.filter((s) => s.runnable).sort(order);
      current = runnable[0] ?? null;
      used = 0;
      decisions.push({
        time,
        reason: current ? due : 'idle',
        woke: woke.map((s) => s.name),
        candidates: runnable.map(({ name, vruntime }) => ({ name, vruntime })),
        picked: current?.name ?? null,
      });
      due = null;
    }

    if (!current) {
      timeline.push(null);
      continue;
    }
    const task: State = current;
    const woken = wokeAt.get(task.name);
    if (woken !== undefined) {
      waits[task.name]!.push(time - woken);
      wokeAt.delete(task.name);
    }
    timeline.push(task.name);
    task.cpu += 1;
    task.vruntime += Math.floor((MS * 1024) / task.weight);
    task.lastRan = time;
    used += 1;
    task.left -= 1;
    if (task.left === 0) {
      task.runnable = false;
      task.wakeAt = time + 1 + task.sleep;
      current = null;
      due = 'went to sleep';
    }
  }
  return {
    timeline,
    decisions,
    cpu: Object.fromEntries(states.map((s) => [s.name, s.cpu])),
    waits,
  };
}

/** Merges consecutive milliseconds of the same task. */
export function runs(timeline: readonly (string | null)[]) {
  const out: { task: string | null; start: number; end: number }[] = [];
  timeline.forEach((task, time) => {
    const last = out.at(-1);
    if (last && last.task === task) last.end = time + 1;
    else out.push({ task, start: time, end: time + 1 });
  });
  return out;
}

/** The lab's answer: who ran in order, and each task's CPU milliseconds. */
export function solve(
  tasks: readonly Task[],
  quantum: number,
  duration: number,
): Solution {
  const { timeline, cpu } = simulate(tasks, quantum, duration);
  return { order: runs(timeline).map((r) => r.task), cpu };
}

/** The lesson's running example: two busy tasks and one that sleeps. */
export const EXAMPLE = {
  tasks: [
    { name: 'A', nice: 0 },
    { name: 'B', nice: 5 },
    { name: 'C', nice: 0, run: 1, sleep: 3 },
  ] as Task[],
  quantum: 3,
  duration: 36,
};

/** CPU shares of a busy pair, as fractions of the CPU. */
export function pairShare(niceA: number, niceB: number) {
  const a = weightOf(niceA);
  const b = weightOf(niceB);
  return { a: a / (a + b), b: b / (a + b) };
}

/** The lesson's verified output. */
export function schedulingExample(): string {
  const { tasks, quantum, duration } = EXAMPLE;
  const result = simulate(tasks, quantum, duration);
  const line = runs(result.timeline)
    .map((r) => `${r.task ?? '-'}${r.end - r.start}`)
    .join(' ');
  const cpu = Object.entries(result.cpu)
    .map(([name, ms]) => `${name} ${ms} ms`)
    .join(', ');
  const share = pairShare(0, 5);
  return [
    `order: ${line}`,
    `cpu over ${duration} ms: ${cpu}`,
    `C's waits after waking: ${result.waits.C!.join(', ')} ms`,
    `busy pair at nice 0 and 5: ${(share.a * 100).toFixed(1)}% and ${(share.b * 100).toFixed(1)}%`,
  ].join('\n');
}
