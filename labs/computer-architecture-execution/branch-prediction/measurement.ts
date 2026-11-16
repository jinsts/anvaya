// Summaries of the recorded sorted-versus-random measurement.
export interface VariantRecord {
  order: 'sorted' | 'random';
  rep: number;
  nsPerElement: number;
  sum: string;
}
export interface Variant {
  label: string;
  flags: string[];
  records: VariantRecord[];
}

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export function summarizeVariants(variants: readonly Variant[]) {
  return variants.map((v) => {
    const of = (order: 'sorted' | 'random') =>
      v.records.filter((r) => r.order === order).map((r) => r.nsPerElement);
    const random = of('random');
    const sorted = of('sorted');
    return {
      label: v.label,
      flags: v.flags,
      random: { median: median(random), values: random },
      sorted: { median: median(sorted), values: sorted },
      ratio: median(random) / median(sorted),
    };
  });
}

/** Conditional jumps in a function listing, excluding the loop's own jne. */
export function conditionalJumps(listing: string): string[] {
  return listing
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => /^j(?!mp)[a-z]+ /.test(l));
}
