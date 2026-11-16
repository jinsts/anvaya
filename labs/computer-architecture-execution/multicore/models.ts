// Teaching models for one cache line shared by two cores (MESI), a
// message-passing litmus test with and without release/acquire, and an
// unsynchronized counter update. None of them is a formal memory model.

export type Mesi = 'M' | 'E' | 'S' | 'I';
export interface CoherenceOp {
  core: 0 | 1;
  op: 'read' | 'write';
}
export interface CoherenceStep extends CoherenceOp {
  before: [Mesi, Mesi];
  after: [Mesi, Mesi];
  hit: boolean;
  /** What the requesting cache announces, if anything. */
  message: 'none' | 'read miss' | 'request for ownership';
  /** The other core's copy that this access invalidated or downgraded. */
  effect:
    | 'none'
    | 'invalidated'
    | 'downgraded to S'
    | 'supplied data, invalidated'
    | 'supplied data, downgraded to S';
}

/** MESI for one line, following the transitions in Drepper section 3.3.4. */
export function mesi(ops: readonly CoherenceOp[]): CoherenceStep[] {
  const state: [Mesi, Mesi] = ['I', 'I'];
  return ops.map(({ core, op }) => {
    if (core !== 0 && core !== 1) throw new RangeError('Cores are 0 and 1.');
    const other = (1 - core) as 0 | 1;
    const before: [Mesi, Mesi] = [state[0], state[1]];
    const mine = state[core];
    const theirs = state[other];
    let hit = true;
    let message: CoherenceStep['message'] = 'none';
    let effect: CoherenceStep['effect'] = 'none';
    if (op === 'read') {
      if (mine === 'I') {
        hit = false;
        message = 'read miss';
        if (theirs === 'M') effect = 'supplied data, downgraded to S';
        else if (theirs === 'E') effect = 'downgraded to S';
        state[core] = theirs === 'I' ? 'E' : 'S';
        if (theirs !== 'I') state[other] = 'S';
      }
    } else {
      if (mine === 'I' || mine === 'S') {
        hit = mine === 'S';
        message = 'request for ownership';
        if (theirs === 'M') effect = 'supplied data, invalidated';
        else if (theirs !== 'I') effect = 'invalidated';
        state[other] = 'I';
      }
      state[core] = 'M'; // E → M needs no message: no other copy exists
    }
    return {
      core,
      op,
      before,
      after: [state[0], state[1]],
      hit,
      message,
      effect,
    };
  });
}

/** The access script the lesson's stepper and transition table follow. */
export const MESI_SCRIPT: readonly CoherenceOp[] = [
  { core: 0, op: 'read' },
  { core: 1, op: 'read' },
  { core: 0, op: 'write' },
  { core: 1, op: 'read' },
  { core: 1, op: 'write' },
  { core: 0, op: 'write' },
  { core: 0, op: 'write' },
];

/** Two cores alternately writing their own counters, on one line or two. */
export function falseSharing(writes: number) {
  const alternating: CoherenceOp[] = Array.from({ length: writes }, (_, i) => ({
    core: (i % 2) as 0 | 1,
    op: 'write' as const,
  }));
  const shared = mesi(alternating);
  // Padded: each core's counter is on its own line, so each line has one writer.
  const own = (core: 0 | 1) => mesi(alternating.filter((o) => o.core === core));
  const padded = [...own(0), ...own(1)];
  const count = (steps: CoherenceStep[]) =>
    steps.filter((s) => s.message === 'request for ownership').length;
  return {
    shared,
    sharedOwnershipRequests: count(shared),
    paddedOwnershipRequests: count(padded),
  };
}

export type Order = 'relaxed' | 'release' | 'acquire';
export interface MemoryOp {
  kind: 'store' | 'load';
  location: string;
  value?: number;
  register?: string;
  order: Order;
}

/** Program orders each thread may appear to execute in. Release and acquire
 * are one-way barriers (Linux kernel memory-barriers.txt): nothing before a
 * release moves after it, and nothing after an acquire moves before it.
 * Accesses to the same location keep their order. */
export function allowedOrders(ops: readonly MemoryOp[]): MemoryOp[][] {
  const permutations = (items: readonly number[]): number[][] =>
    items.length <= 1
      ? [[...items]]
      : items.flatMap((x, i) =>
          permutations(items.filter((_, j) => j !== i)).map((rest) => [
            x,
            ...rest,
          ]),
        );
  const mustPrecede = (a: number, b: number) =>
    a < b &&
    (ops[b]!.order === 'release' ||
      ops[a]!.order === 'acquire' ||
      ops[a]!.location === ops[b]!.location);
  return permutations(ops.map((_, i) => i))
    .filter((order) =>
      order.every((x, i) =>
        order.slice(i + 1).every((y) => !mustPrecede(y, x)),
      ),
    )
    .map((order) => order.map((i) => ops[i]!));
}

function interleavings<T>(a: readonly T[], b: readonly T[]): T[][] {
  if (a.length === 0) return [[...b]];
  if (b.length === 0) return [[...a]];
  return [
    ...interleavings(a.slice(1), b).map((rest) => [a[0]!, ...rest]),
    ...interleavings(a, b.slice(1)).map((rest) => [b[0]!, ...rest]),
  ];
}

/** Every outcome of two threads' registers, with how many executions give it. */
export function outcomes(thread0: MemoryOp[], thread1: MemoryOp[]) {
  const counts = new Map<string, number>();
  for (const order0 of allowedOrders(thread0))
    for (const order1 of allowedOrders(thread1))
      for (const run of interleavings(order0, order1)) {
        const memory = new Map<string, number>();
        const registers: Record<string, number> = {};
        for (const op of run)
          if (op.kind === 'store') memory.set(op.location, op.value!);
          else registers[op.register!] = memory.get(op.location) ?? 0;
        const key = Object.keys(registers)
          .sort()
          .map((r) => `${r}=${registers[r]}`)
          .join(', ');
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([outcome, executions]) => ({ outcome, executions }));
}

/** The message-passing test: publish data, then raise a flag. */
export function messagePassing(synchronized: boolean) {
  const writer: MemoryOp[] = [
    { kind: 'store', location: 'data', value: 42, order: 'relaxed' },
    {
      kind: 'store',
      location: 'flag',
      value: 1,
      order: synchronized ? 'release' : 'relaxed',
    },
  ];
  const reader: MemoryOp[] = [
    {
      kind: 'load',
      location: 'flag',
      register: 'r1',
      order: synchronized ? 'acquire' : 'relaxed',
    },
    { kind: 'load', location: 'data', register: 'r2', order: 'relaxed' },
  ];
  return outcomes(writer, reader);
}

/** Store buffering: each thread stores to one location, then loads the other. */
export function storeBuffering(synchronized: boolean) {
  const thread = (
    mine: string,
    theirs: string,
    register: string,
  ): MemoryOp[] => [
    {
      kind: 'store',
      location: mine,
      value: 1,
      order: synchronized ? 'release' : 'relaxed',
    },
    {
      kind: 'load',
      location: theirs,
      register,
      order: synchronized ? 'acquire' : 'relaxed',
    },
  ];
  return outcomes(thread('x', 'y', 'r1'), thread('y', 'x', 'r2'));
}

/** Two threads add 1 to a counter starting at 7: three steps each, or one atomic step. */
export function lostUpdate(atomic: boolean) {
  type Step = { thread: number; kind: 'load' | 'add' | 'store' | 'fetch_add' };
  const thread = (t: number): Step[] =>
    atomic
      ? [{ thread: t, kind: 'fetch_add' }]
      : [
          { thread: t, kind: 'load' },
          { thread: t, kind: 'add' },
          { thread: t, kind: 'store' },
        ];
  const results = new Map<number, Step[][]>();
  for (const run of interleavings(thread(0), thread(1))) {
    let counter = 7;
    const local = [0, 0];
    for (const step of run) {
      if (step.kind === 'load') local[step.thread] = counter;
      else if (step.kind === 'add') local[step.thread]! += 1;
      else if (step.kind === 'store') counter = local[step.thread]!;
      else counter += 1;
    }
    results.set(counter, [...(results.get(counter) ?? []), run]);
  }
  return [...results.entries()]
    .sort(([a], [b]) => a - b)
    .map(([final, runs]) => ({
      final,
      executions: runs.length,
      example: runs[0]!.map((s) => `${s.thread === 0 ? 'A' : 'B'} ${s.kind}`),
    }));
}

export function multicoreExample(): string {
  const steps = mesi([
    { core: 0, op: 'read' },
    { core: 1, op: 'read' },
    { core: 0, op: 'write' },
    { core: 1, op: 'read' },
  ]);
  const sharing = falseSharing(8);
  const show = (sync: boolean) =>
    messagePassing(sync)
      .map((o) => o.outcome)
      .join(' | ');
  return [
    `MESI: ${steps.map((s) => s.after.join('')).join(' → ')}`,
    `8 alternating writes: ${sharing.sharedOwnershipRequests} ownership requests on one line, ${sharing.paddedOwnershipRequests} padded`,
    `relaxed: ${show(false)}`,
    `release/acquire: ${show(true)}`,
    `counter: plain ${lostUpdate(false)
      .map((o) => o.final)
      .join(' or ')}, atomic ${lostUpdate(true)
      .map((o) => o.final)
      .join(' or ')}`,
  ].join('\n');
}
