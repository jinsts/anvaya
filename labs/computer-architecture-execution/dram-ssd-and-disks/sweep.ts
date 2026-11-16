// Summaries of the recorded working-set sweep and the cache sizes recorded
// with it, for the lesson's chart and table.

export interface SweepRecord {
  size: number;
  rep: number;
  loads: number;
  nsPerLoad: number;
  end: number;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** Median, minimum and maximum time per load for each working-set size. */
export function summarize(records: readonly SweepRecord[]) {
  const bySize = new Map<number, number[]>();
  for (const r of records)
    bySize.set(r.size, [...(bySize.get(r.size) ?? []), r.nsPerLoad]);
  return [...bySize.entries()]
    .sort(([a], [b]) => a - b)
    .map(([size, values]) => ({
      size,
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      reps: values.length,
    }));
}

/** Data and unified cache sizes from `lscpu --caches` output. */
export function parseCaches(text: string) {
  const units: Record<string, number> = { K: 1024, M: 1024 ** 2, G: 1024 ** 3 };
  return text
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([, , , , type]) => type !== 'Instruction')
    .map(([name, size]) => {
      const match = /^(\d+)([KMG])$/.exec(size!);
      if (!match) throw new Error(`Unexpected cache size ${size}`);
      return { name: name!, bytes: Number(match[1]) * units[match[2]!]! };
    });
}

/** The smallest level whose capacity holds the working set, or DRAM. */
export function levelFor(
  size: number,
  caches: { name: string; bytes: number }[],
) {
  return caches.find((c) => size <= c.bytes)?.name ?? 'DRAM';
}

/** Median of the per-size medians within each level, for the summary table. */
export function byLevel(
  summary: ReturnType<typeof summarize>,
  caches: { name: string; bytes: number }[],
) {
  const groups = new Map<string, number[]>();
  for (const s of summary) {
    const level = levelFor(s.size, caches);
    groups.set(level, [...(groups.get(level) ?? []), s.median]);
  }
  return [...groups.entries()].map(([level, medians]) => ({
    level,
    sizes: medians.length,
    median: median(medians),
  }));
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 2) return `${bytes / 1024 ** 2} MiB`;
  return `${bytes / 1024} KiB`;
}
