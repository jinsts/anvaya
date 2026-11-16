// Summaries for repeated timings, a roofline bound and counter ratios. The
// roofline machine and counter values in the lesson are illustrative inputs.

function finite(values: readonly number[]): void {
  if (values.length === 0) throw new RangeError('Need at least one value.');
  if (values.some((v) => !Number.isFinite(v)))
    throw new RangeError('Values must be finite.');
}

/** Nearest-rank percentile: the value at rank ceil(p/100 × n), 1-based. */
export function percentile(values: readonly number[], p: number): number {
  finite(values);
  if (!(p > 0 && p <= 100)) throw new RangeError('p must be in (0, 100].');
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((p / 100) * sorted.length) - 1]!;
}

export function summarize(values: readonly number[]) {
  finite(values);
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median =
    n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
  return {
    n,
    min: sorted[0]!,
    p10: percentile(sorted, 10),
    median,
    p90: percentile(sorted, 90),
    max: sorted[n - 1]!,
  };
}

/** Share of all (a, b) pairings in which the run from a was faster. */
export function shareFaster(a: readonly number[], b: readonly number[]) {
  finite(a);
  finite(b);
  let wins = 0;
  for (const x of a) for (const y of b) wins += x < y ? 1 : x === y ? 0.5 : 0;
  return wins / (a.length * b.length);
}

function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${label} must be positive and finite.`);
}

/** Williams, Waterman and Patterson: min(peak, bandwidth × intensity). */
export function roofline(
  peakGflops: number,
  bandwidthGBs: number,
  flopsPerByte: number,
): number {
  positive(peakGflops, 'Peak');
  positive(bandwidthGBs, 'Bandwidth');
  positive(flopsPerByte, 'Intensity');
  return Math.min(peakGflops, bandwidthGBs * flopsPerByte);
}

/** The intensity at which the bandwidth roof meets the compute roof. */
export function ridgePoint(peakGflops: number, bandwidthGBs: number): number {
  positive(peakGflops, 'Peak');
  positive(bandwidthGBs, 'Bandwidth');
  return peakGflops / bandwidthGBs;
}

/** Instructions per cycle from two counter totals. */
export function ipc(instructions: number, cycles: number): number {
  if (!Number.isSafeInteger(instructions) || instructions < 0)
    throw new RangeError('Instructions must be a nonnegative safe integer.');
  if (!Number.isSafeInteger(cycles) || cycles <= 0)
    throw new RangeError('Cycles must be a positive safe integer.');
  return instructions / cycles;
}

/** Floating-point operations per byte moved, for three float kernels. */
export const KERNELS = [
  // c[i] = a[i] + b[i]: one add; read 8 bytes, write 4.
  { name: 'Array add', flopsPerByte: 1 / 12 },
  // sum += a[i] * b[i]: a multiply and an add per 8 bytes read.
  { name: 'Dot product', flopsPerByte: 2 / 8 },
  // n × n float matrix multiply, n = 1024, if each matrix crosses memory once:
  // 2n³ flops over 3n² × 4 bytes.
  {
    name: 'Matrix multiply',
    flopsPerByte: (2 * 1024 ** 3) / (3 * 1024 ** 2 * 4),
  },
] as const;

export function measuringExample(): string {
  const s = summarize([
    0.31, 0.24, 0.22, 0.25, 0.4, 0.23, 0.24, 0.26, 0.21, 0.24,
  ]);
  return [
    `median ${s.median}, p90 ${s.p90}, min ${s.min}, max ${s.max}`,
    `A faster than B in ${(shareFaster([1, 2, 3], [2, 3, 4]) * 100).toFixed(1)}% of pairings`,
    `illustrative roof at 100 GFLOP/s and 50 GB/s: ridge ${ridgePoint(100, 50)} flops/byte`,
    ...KERNELS.map(
      (k) =>
        `${k.name}: ${k.flopsPerByte.toFixed(3)} flops/byte, bound ${roofline(100, 50, k.flopsPerByte).toFixed(1)} GFLOP/s`,
    ),
    `illustrative counters: 4,000,000,000 instructions in 2,500,000,000 cycles = IPC ${ipc(4e9, 2.5e9)}`,
  ].join('\n');
}
