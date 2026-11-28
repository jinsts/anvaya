// How a vectorized loop divides n elements into full vectors and a scalar
// remainder, and why a floating-point sum computed by lanes can differ from
// the sum in source order.

export function vectorPlan(n: number, lanes: number) {
  if (!Number.isInteger(n) || n < 0)
    throw new RangeError('n is a whole number.');
  if (![2, 4, 8, 16].includes(lanes))
    throw new RangeError('Use 2, 4, 8 or 16 lanes.');
  const vectorIterations = Math.floor(n / lanes);
  const remainder = n - vectorIterations * lanes;
  const groups: { kind: 'vector' | 'scalar'; first: number; count: number }[] =
    [];
  for (let i = 0; i < vectorIterations; i++)
    groups.push({ kind: 'vector', first: i * lanes, count: lanes });
  for (let i = vectorIterations * lanes; i < n; i++)
    groups.push({ kind: 'scalar', first: i, count: 1 });
  return { vectorIterations, remainder, groups, loopIterations: groups.length };
}

/** Element-wise addition done one vector group at a time. */
export function addByGroups(
  a: readonly number[],
  b: readonly number[],
  lanes: number,
) {
  if (a.length !== b.length) throw new RangeError('Arrays differ in length.');
  const out = Array<number>(a.length).fill(0);
  for (const g of vectorPlan(a.length, lanes).groups)
    for (let i = g.first; i < g.first + g.count; i++)
      out[i] = (a[i]! + b[i]!) | 0;
  return out;
}

const f = Math.fround;

/** binary32 sum in source order, as -O3 without reassociation computes it. */
export function sumInOrder(values: readonly number[]): number {
  return values.reduce((sum, v) => f(sum + f(v)), 0);
}

/**
 * binary32 sum as GCC's reassociated -O3 loop computes it for four lanes:
 * each lane accumulates every fourth element, then the lanes combine as
 * (l0 + l2) + (l1 + l3), and any remainder is added in order after that.
 */
export function sumByLanes(values: readonly number[]): number {
  for (const v of values)
    if (typeof v !== 'number' || (Number.isFinite(v) && !Number.isFinite(f(v))))
      throw new RangeError(`${String(v)} is not a binary32 value.`);
  const n = values.length - (values.length % 4);
  const lane = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) lane[i % 4] = f(lane[i % 4]! + f(values[i]!));
  let sum = n ? f(f(lane[0]! + lane[2]!) + f(lane[1]! + lane[3]!)) : 0;
  for (let i = n; i < values.length; i++) sum = f(sum + f(values[i]!));
  return sum;
}

/** The intermediate values of both summation orders, for the figure. */
export function sumTrace(values: readonly number[]) {
  if (values.length % 4 !== 0)
    throw new RangeError('Use a multiple of four values.');
  const inOrder: number[] = [];
  let running = 0;
  for (const v of values) inOrder.push((running = f(running + f(v))));
  const lanes = [0, 1, 2, 3].map((l) =>
    values.filter((_, i) => i % 4 === l).reduce((s, v) => f(s + f(v)), 0),
  );
  const pairs = [f(lanes[0]! + lanes[2]!), f(lanes[1]! + lanes[3]!)];
  return { inOrder, lanes, pairs, total: f(pairs[0]! + pairs[1]!) };
}

/** The loops GCC reports as vectorized, by source line and vector width. */
export function vectorizedLoops(report: string) {
  return report
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const m =
        /:(\d+):\d+: optimized: loop vectorized using (\d+) byte vectors/.exec(
          line,
        );
      if (!m) throw new Error(`Unexpected report line: ${line}`);
      return { line: Number(m[1]), bytes: Number(m[2]) };
    });
}

export function simdExample(): string {
  const plan = vectorPlan(10, 4);
  const values = [2 ** 24, 1, 1, 1, 1, 1, 1, 1];
  return [
    `n = 10, 4 lanes: ${plan.vectorIterations} vector iterations + ${plan.remainder} scalar`,
    `in order: ${sumInOrder(values)}; by lanes: ${sumByLanes(values)}; exact: ${2 ** 24 + 7}`,
  ].join('\n');
}
