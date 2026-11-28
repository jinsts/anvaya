// The average time of one memory access, as arithmetic on stated parameters.
// A teaching model: every access is blocking and sequential, with no overlap,
// prefetching or misses in flight together. Each level's miss rate is local:
// the fraction of the accesses that reach that level and miss it. A miss pays
// the next level's average time on top of the lookup already paid. The TLB is
// fully associative with LRU replacement and starts cold. The lesson's
// parameters are illustrative, not measurements of a processor.

export interface Level {
  /** Lookup time paid by every access that reaches this level. */
  hitNs: number;
  /** Fraction of the accesses reaching this level that miss it. */
  missRate: number;
}

function checkTime(value: number, what: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${what} must be a nonnegative finite time.`);
}

function checkLevels(levels: readonly Level[], memoryNs: number): void {
  for (const { hitNs, missRate } of levels) {
    checkTime(hitNs, 'A hit time');
    if (!Number.isFinite(missRate) || missRate < 0 || missRate > 1)
      throw new RangeError('A miss rate must be from 0 through 1.');
  }
  checkTime(memoryNs, 'The memory time');
}

/** Hit time plus local miss rate times the next level's average, innermost last. */
export function averageAccessTime(
  levels: readonly Level[],
  memoryNs: number,
): number {
  checkLevels(levels, memoryNs);
  return levels.reduceRight(
    (next, level) => level.hitNs + level.missRate * next,
    memoryNs,
  );
}

export interface Part {
  /** 'L1', 'L2', … or 'memory'. */
  name: string;
  /** Fraction of all accesses that reach this level: its global reach. */
  reach: number;
  /** What this level adds to the average: reach times its time. */
  ns: number;
}

/** The average split by level; the parts sum to averageAccessTime. */
export function accessTimeParts(
  levels: readonly Level[],
  memoryNs: number,
): Part[] {
  checkLevels(levels, memoryNs);
  let reach = 1;
  const parts = levels.map((level, index) => {
    const part = { name: `L${index + 1}`, reach, ns: reach * level.hitNs };
    reach *= level.missRate;
    return part;
  });
  return [...parts, { name: 'memory', reach, ns: reach * memoryNs }];
}

export interface Translation {
  /** TLB lookup time, paid by every access before a physically indexed cache. */
  tlbNs: number;
  /** Fraction of accesses whose translation is not in the TLB. */
  tlbMissRate: number;
  /** Time for the page-table walk that a TLB miss adds. */
  walkNs: number;
}

/** Translate first, then access the data: the cost a physically indexed cache sees. */
export function translatedAccessTime(
  { tlbNs, tlbMissRate, walkNs }: Translation,
  dataNs: number,
): number {
  checkTime(tlbNs, 'The TLB time');
  checkTime(walkNs, 'The walk time');
  checkTime(dataNs, 'The data access time');
  if (!Number.isFinite(tlbMissRate) || tlbMissRate < 0 || tlbMissRate > 1)
    throw new RangeError('A miss rate must be from 0 through 1.');
  return tlbNs + tlbMissRate * walkNs + dataNs;
}

/** Hit or miss for each page number, through a cold LRU TLB of `entries`. */
export function traceTlb(
  pages: readonly number[],
  entries: number,
): ('hit' | 'miss')[] {
  if (!Number.isSafeInteger(entries) || entries < 1)
    throw new RangeError('A TLB needs a whole number of entries, at least 1.');
  const recent: number[] = []; // least recently used first
  return pages.map((page) => {
    if (!Number.isSafeInteger(page) || page < 0)
      throw new RangeError('Page numbers are nonnegative safe integers.');
    const at = recent.indexOf(page);
    if (at >= 0) recent.splice(at, 1);
    else if (recent.length === entries) recent.shift();
    recent.push(page);
    return at >= 0 ? 'hit' : 'miss';
  });
}

/** Bytes the TLB can translate without a miss: entries times page size. */
export function tlbReach(entries: number, pageBytes: number): number {
  for (const value of [entries, pageBytes])
    if (!Number.isSafeInteger(value) || value < 1)
      throw new RangeError('Entries and page size must be positive integers.');
  return entries * pageBytes;
}

/** A time or rate for display, without binary floating-point noise. */
export const shown = (value: number) => Number(value.toFixed(6));

/** Page numbers 0 … pages − 1, visited in order, twice. */
export const twoPasses = (pages: number) =>
  Array.from({ length: 2 * pages }, (_, i) => i % pages);

/** The lesson's illustrative hierarchy: L1 then L2, then 80 ns memory. */
export const LESSON_LEVELS: readonly Level[] = [
  { hitNs: 1, missRate: 0.1 },
  { hitNs: 4, missRate: 0.25 },
];
export const LESSON_MEMORY_NS = 80;

export function accessTimeExample(): string {
  const data = averageAccessTime(LESSON_LEVELS, LESSON_MEMORY_NS);
  const memory = accessTimeParts(LESSON_LEVELS, LESSON_MEMORY_NS).at(-1)!;
  const translated = translatedAccessTime(
    { tlbNs: 0.5, tlbMissRate: 0.01, walkNs: 40 },
    data,
  );
  return [
    `one level: ${shown(averageAccessTime([{ hitNs: 1, missRate: 0.1 }], 50))} ns`,
    `two levels: ${shown(data)} ns; ${shown(memory.reach * 100)}% of loads reach memory`,
    `with translation: ${shown(translated)} ns`,
    `3 pages twice, 4-entry TLB: ${traceTlb(twoPasses(3), 4).join(' ')}`,
    `5 pages twice, 4-entry TLB: ${traceTlb(twoPasses(5), 4).join(' ')}`,
  ].join('\n');
}
