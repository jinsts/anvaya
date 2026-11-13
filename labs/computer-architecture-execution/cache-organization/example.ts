// A teaching model of one cache level. Line size and set count are powers of
// two, any number of ways is allowed, and replacement is exact LRU. Addresses
// are byte addresses chosen by the caller; nothing here inspects a processor.

export type WritePolicy = 'write-back' | 'write-through';
export type AllocatePolicy = 'write-allocate' | 'no-write-allocate';
export type MissKind = 'compulsory' | 'capacity' | 'conflict';

export interface CacheGeometry {
  lineBytes: number;
  sets: number;
  ways: number;
  write?: WritePolicy;
  allocate?: AllocatePolicy;
}

export interface Access {
  kind: 'read' | 'write';
  address: number;
}

export interface Line {
  block: number;
  tag: number;
  dirty: boolean;
  lastUse: number;
}

export interface Step {
  access: Access;
  block: number;
  tag: number;
  set: number;
  offset: number;
  hit: boolean;
  miss?: MissKind;
  /** The way holding the block afterwards, or null if it was not cached. */
  way: number | null;
  evicted?: { block: number; dirty: boolean };
  /** Lines read from the next level. */
  fills: number;
  /** Write transactions sent to the next level. */
  nextLevelWrites: number;
  /** Cache contents after this access, by set and then way. */
  lines: (Line | null)[][];
}

const powerOfTwo = (value: number, max: number) =>
  Number.isSafeInteger(value) &&
  value > 0 &&
  value <= max &&
  (value & (value - 1)) === 0;

export function checkGeometry({ lineBytes, sets, ways }: CacheGeometry): void {
  if (!powerOfTwo(lineBytes, 4096) || !powerOfTwo(sets, 65536))
    throw new RangeError('Line size and set count must be powers of two.');
  if (!Number.isSafeInteger(ways) || ways < 1 || ways > 64)
    throw new RangeError('Ways must be an integer from 1 to 64.');
}

/** Bit widths of the offset and set fields; the tag is every higher bit. */
export function fieldBits({ lineBytes, sets }: CacheGeometry) {
  return { offset: Math.log2(lineBytes), set: Math.log2(sets) };
}

export function splitAddress(address: number, geometry: CacheGeometry) {
  if (!Number.isSafeInteger(address) || address < 0)
    throw new RangeError('Expected a nonnegative safe byte address.');
  const block = Math.floor(address / geometry.lineBytes);
  return {
    block,
    offset: address % geometry.lineBytes,
    set: block % geometry.sets,
    tag: Math.floor(block / geometry.sets),
  };
}

// Fully associative LRU cache of the same capacity, most recent block last.
// A miss that this cache would hit is a conflict miss; otherwise capacity.
function touchShadow(
  shadow: number[],
  block: number,
  capacity: number,
  allocate: boolean,
): boolean {
  const index = shadow.indexOf(block);
  if (index >= 0) shadow.splice(index, 1);
  if (index >= 0 || allocate) shadow.push(block);
  if (shadow.length > capacity) shadow.shift();
  return index >= 0;
}

export function simulateCache(
  accesses: readonly Access[],
  geometry: CacheGeometry,
): Step[] {
  checkGeometry(geometry);
  const { ways, write = 'write-back', allocate = 'write-allocate' } = geometry;
  const cache: (Line | null)[][] = Array.from({ length: geometry.sets }, () =>
    Array<Line | null>(ways).fill(null),
  );
  const shadow: number[] = [];
  const everFilled = new Set<number>();
  return accesses.map((access, time) => {
    if (access.kind !== 'read' && access.kind !== 'write')
      throw new RangeError('Access kind must be read or write.');
    const { block, tag, set, offset } = splitAddress(access.address, geometry);
    const lines = cache[set]!;
    const isWrite = access.kind === 'write';
    const fillsOnMiss = !isWrite || allocate === 'write-allocate';
    const shadowHit = touchShadow(
      shadow,
      block,
      geometry.sets * ways,
      fillsOnMiss,
    );
    let way = lines.findIndex((line) => line?.block === block);
    const hit = way >= 0;
    let miss: MissKind | undefined;
    let evicted: Step['evicted'];
    let fills = 0;
    let nextLevelWrites = 0;
    if (!hit) {
      miss = !everFilled.has(block)
        ? 'compulsory'
        : shadowHit
          ? 'conflict'
          : 'capacity';
      if (fillsOnMiss) {
        way = lines.indexOf(null);
        if (way < 0)
          way = lines.reduce(
            (oldest, line, index) =>
              line!.lastUse < lines[oldest]!.lastUse ? index : oldest,
            0,
          );
        const victim = lines[way];
        if (victim) {
          evicted = { block: victim.block, dirty: victim.dirty };
          if (victim.dirty) nextLevelWrites += 1;
        }
        lines[way] = { block, tag, dirty: false, lastUse: time };
        everFilled.add(block);
        fills = 1;
      }
    }
    const line = way >= 0 ? lines[way]! : null;
    if (line) line.lastUse = time;
    if (isWrite) {
      if (line && write === 'write-back') line.dirty = true;
      else nextLevelWrites += 1;
    }
    return {
      access,
      block,
      tag,
      set,
      offset,
      hit,
      ...(miss && { miss }),
      way: line ? way : null,
      ...(evicted && { evicted }),
      fills,
      nextLevelWrites,
      lines: cache.map((row) => row.map((entry) => entry && { ...entry })),
    };
  });
}

export function summarize(steps: readonly Step[]) {
  const total = (pick: (step: Step) => number) =>
    steps.reduce((sum, step) => sum + pick(step), 0);
  const misses = (kind: MissKind) => total((s) => (s.miss === kind ? 1 : 0));
  return {
    hits: total((s) => (s.hit ? 1 : 0)),
    misses: total((s) => (s.hit ? 0 : 1)),
    compulsory: misses('compulsory'),
    capacity: misses('capacity'),
    conflict: misses('conflict'),
    fills: total((s) => s.fills),
    nextLevelWrites: total((s) => s.nextLevelWrites),
  };
}

export const read = (address: number): Access => ({ kind: 'read', address });
export const write = (address: number): Access => ({ kind: 'write', address });

export function cacheOrganizationExample(): string {
  const reads = [0, 64, 0, 64, 128, 0].map(read);
  const placement = (
    [
      ['direct-mapped', 4, 1],
      ['2-way', 2, 2],
      ['fully associative', 1, 4],
    ] as const
  ).map(([name, sets, ways]) => {
    const steps = simulateCache(reads, { lineBytes: 16, sets, ways });
    const count = summarize(steps);
    const results = steps.map((s) => (s.hit ? 'hit' : 'miss')).join(' ');
    return `${name} ${sets}x${ways}: ${results} | ${count.compulsory} compulsory, ${count.conflict} conflict`;
  });
  // Eight stores to one counter, then two reads that evict its line.
  const stores = [
    read(0),
    ...Array.from({ length: 8 }, () => write(0)),
    read(64),
    read(128),
  ];
  const policies = (['write-through', 'write-back'] as const).map((policy) => {
    const steps = simulateCache(stores, {
      lineBytes: 16,
      sets: 2,
      ways: 2,
      write: policy,
    });
    return `8 stores, ${policy}: next-level writes = ${summarize(steps).nextLevelWrites}`;
  });
  return [...placement, ...policies].join('\n');
}
