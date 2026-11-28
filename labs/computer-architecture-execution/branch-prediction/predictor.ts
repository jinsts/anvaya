// Branch predictors and a reorder buffer as small, checkable models.

export type PredictorKind = 'one-bit' | 'two-bit';

/** States 0–3 for two-bit (0, 1 predict not taken; 2, 3 taken); 0–1 for one-bit. */
export interface PredictionStep {
  outcome: boolean;
  state: number;
  prediction: boolean;
  correct: boolean;
  next: number;
}

export const STATE_NAMES: Record<PredictorKind, string[]> = {
  'one-bit': ['predict not taken', 'predict taken'],
  'two-bit': [
    'strongly not taken',
    'weakly not taken',
    'weakly taken',
    'strongly taken',
  ],
};

/**
 * One predictor entry over a branch's outcomes. A two-bit counter moves one
 * step toward each outcome and saturates at 0 and 3, so a single surprise
 * does not flip a strong prediction.
 */
export function predict(
  outcomes: readonly boolean[],
  kind: PredictorKind,
  initial = kind === 'two-bit' ? 1 : 0,
): PredictionStep[] {
  const top = kind === 'two-bit' ? 3 : 1;
  if (!Number.isInteger(initial) || initial < 0 || initial > top)
    throw new RangeError(`Initial state must be 0 to ${top}.`);
  let state = initial;
  return outcomes.map((outcome) => {
    if (typeof outcome !== 'boolean')
      throw new RangeError('Each outcome must be true (taken) or false.');
    const prediction = kind === 'two-bit' ? state >= 2 : state === 1;
    const next =
      kind === 'two-bit'
        ? outcome
          ? Math.min(3, state + 1)
          : Math.max(0, state - 1)
        : outcome
          ? 1
          : 0;
    const step = {
      outcome,
      state,
      prediction,
      correct: prediction === outcome,
      next,
    };
    state = next;
    return step;
  });
}

export const accuracy = (steps: readonly PredictionStep[]) =>
  steps.length === 0 ? 1 : steps.filter((s) => s.correct).length / steps.length;

/** Deterministic pseudo-random bytes (xorshift), for the data-dependent stream. */
function bytes(count: number, seed: number): number[] {
  let state = seed;
  return Array.from({ length: count }, () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state & 0xff;
  });
}

const values = bytes(24, 0x9e3779b9);
const loop = (iterations: number, runs: number) =>
  Array.from({ length: runs }, () => [
    ...Array<boolean>(iterations - 1).fill(true),
    false,
  ]).flat();

/** Outcome streams for one branch, each with its source pattern. */
export const STREAMS = [
  {
    id: 'loop',
    label: 'Loop branch: 6 iterations, run 4 times',
    outcomes: loop(6, 4),
  },
  {
    id: 'random',
    label: 'value ≥ 128 on random bytes',
    outcomes: values.map((v) => v >= 128),
  },
  {
    id: 'sorted',
    label: 'value ≥ 128 on the same bytes, sorted',
    outcomes: [...values].sort((a, b) => a - b).map((v) => v >= 128),
  },
  {
    id: 'alternating',
    label: 'Alternating: taken, not taken, …',
    outcomes: Array.from({ length: 16 }, (_, i) => i % 2 === 0),
  },
] as const;

export interface RobInstruction {
  text: string;
  latency: number;
  /** Indexes of earlier instructions whose results this one needs. */
  needs: number[];
}

/**
 * One instruction dispatched per cycle into a reorder buffer. In-order issue
 * waits for every older instruction to start; out-of-order issue starts as
 * soon as operands are ready. Either way, results commit in program order,
 * at most one per cycle, after they complete.
 */
export function reorderBuffer(
  program: readonly RobInstruction[],
  mode: 'in-order' | 'out-of-order',
) {
  const rows: {
    text: string;
    dispatch: number;
    start: number;
    complete: number;
    commit: number;
  }[] = [];
  program.forEach((instruction, i) => {
    if (!Number.isInteger(instruction.latency) || instruction.latency < 1)
      throw new RangeError('Latency is at least one cycle.');
    for (const need of instruction.needs)
      if (!Number.isInteger(need) || need < 0 || need >= i)
        throw new RangeError('An instruction can only need earlier ones.');
    const dispatch = i + 1;
    const ready = Math.max(
      dispatch,
      ...instruction.needs.map((n) => rows[n]!.complete + 1),
    );
    const start =
      mode === 'in-order' && i > 0
        ? Math.max(ready, rows[i - 1]!.start + 1)
        : ready;
    const complete = start + instruction.latency - 1;
    const commit = Math.max(complete + 1, i > 0 ? rows[i - 1]!.commit + 1 : 0);
    rows.push({ text: instruction.text, dispatch, start, complete, commit });
  });
  return { rows, cycles: Math.max(...rows.map((r) => r.commit)) };
}

/** A load that misses in the cache, a dependent add, and independent work. */
export const ROB_PROGRAM: RobInstruction[] = [
  { text: 'ld r1, 0(r2)  (cache miss)', latency: 8, needs: [] },
  { text: 'add r3, r1, 1', latency: 1, needs: [0] },
  { text: 'mul r4, r5, r6', latency: 3, needs: [] },
  { text: 'sub r7, r8, 1', latency: 1, needs: [] },
  { text: 'and r9, r4, r7', latency: 1, needs: [2, 3] },
];

export function predictorExample(): string {
  return [
    ...STREAMS.map(
      (s) =>
        `${s.id}: one-bit ${Math.round(accuracy(predict(s.outcomes, 'one-bit')) * 100)}%, two-bit ${Math.round(accuracy(predict(s.outcomes, 'two-bit')) * 100)}%`,
    ),
    ...(['in-order', 'out-of-order'] as const).map(
      (mode) =>
        `${mode}: last commit in cycle ${reorderBuffer(ROB_PROGRAM, mode).cycles}`,
    ),
  ].join('\n');
}
