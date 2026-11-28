/**
 * The context-switches lesson's model: estimating what one switch costs from
 * ping-pong timings, as lmbench does (OSTEP chapter 6). A round trip between
 * two tasks on one CPU makes two switches and does the same pipe work as one
 * process writing and reading both pipes itself, so
 *
 *   per switch = (ping-pong round trip − pipe round trip) / 2.
 *
 * Each batch pairs a ping-pong timing with a pipe timing taken just before
 * or after it. The estimate's spread uses the architecture subject's
 * convention: the median, and the nearest-rank p90.
 */
import { summarize } from '../../computer-architecture-execution/measuring-performance/stats';

export interface Batch {
  /** Nanoseconds per ping-pong round trip: two switches and the pipe work. */
  pingPongNs: number;
  /** Nanoseconds per round trip of the same pipe work without switching. */
  pipeNs: number;
}

export interface Estimate {
  /** Median and p90 of the per-batch estimates, nanoseconds per switch. */
  median: number;
  p90: number;
}

/** One ping-pong round trip, as the measuring task and its partner see it. */
export const ROUND_TRIP = [
  { who: 'A', step: 'writes a byte to the ping pipe', switches: false },
  {
    who: 'A',
    step: 'reads the pong pipe, which is empty, and blocks',
    switches: true,
  },
  {
    who: 'B',
    step: 'returns from its read of the ping pipe with the byte',
    switches: false,
  },
  { who: 'B', step: 'writes the next byte to the pong pipe', switches: false },
  {
    who: 'B',
    step: 'reads the ping pipe, which is empty, and blocks',
    switches: true,
  },
  {
    who: 'A',
    step: 'returns from its read of the pong pipe and checks the byte',
    switches: false,
  },
] as const;

/** One batch's estimate of the cost of one switch, in nanoseconds. */
export function perSwitch({ pingPongNs, pipeNs }: Batch): number {
  if (!Number.isFinite(pingPongNs) || !Number.isFinite(pipeNs))
    throw new RangeError('Timings must be finite numbers');
  if (pipeNs <= 0) throw new RangeError('Pipe time must be positive');
  if (pingPongNs <= pipeNs)
    throw new RangeError(
      `Ping-pong ${pingPongNs} ns is not slower than the pipe work ${pipeNs} ns`,
    );
  return (pingPongNs - pipeNs) / 2;
}

/** The median and p90 cost of one switch over several batches. */
export function estimate(batches: readonly Batch[]): Estimate {
  if (batches.length === 0) throw new RangeError('Need at least one batch');
  const { median, p90 } = summarize(batches.map(perSwitch));
  return { median, p90 };
}

export interface Recorded {
  kind: 'pipe' | 'processes' | 'threads';
  batch: number;
  nsPerRoundTrip: number;
  roundTrips: number;
  voluntary: number;
  involuntary: number;
}

/** Pairs each batch's ping-pong timing of `kind` with that batch's pipe. */
export function pair(
  records: readonly Recorded[],
  kind: 'processes' | 'threads',
): Batch[] {
  return records
    .filter((r) => r.kind === kind)
    .map((r) => {
      const pipe = records.find(
        (p) => p.kind === 'pipe' && p.batch === r.batch,
      );
      if (!pipe) throw new RangeError(`Batch ${r.batch} has no pipe timing`);
      return { pingPongNs: r.nsPerRoundTrip, pipeNs: pipe.nsPerRoundTrip };
    });
}

/** The lesson's verified output, on illustrative timings. */
export function switchesExample(): string {
  const batches: Batch[] = [
    { pingPongNs: 2600, pipeNs: 800 },
    { pingPongNs: 2400, pipeNs: 820 },
    { pingPongNs: 3000, pipeNs: 790 },
    { pingPongNs: 2500, pipeNs: 810 },
  ];
  const { median, p90 } = estimate(batches);
  return [
    `per switch: ${batches.map((b) => perSwitch(b)).join(', ')} ns`,
    `median ${median} ns, p90 ${p90} ns`,
  ].join('\n');
}
