import { describe, expect, it } from 'vitest';
import {
  cacheOrganizationExample,
  fieldBits,
  read,
  simulateCache,
  splitAddress,
  summarize,
  write,
  type CacheGeometry,
} from './example';

const results = (addresses: number[], geometry: CacheGeometry) =>
  simulateCache(addresses.map(read), geometry).map((step) =>
    step.hit ? 'hit' : (step.miss ?? 'miss'),
  );

describe('address fields', () => {
  it('splits addresses for the recorded 48 KiB, 12-way, 64-byte L1d', () => {
    const l1d = { lineBytes: 64, sets: 49152 / (12 * 64), ways: 12 };
    expect(l1d.sets).toBe(64);
    expect(fieldBits(l1d)).toEqual({ offset: 6, set: 6 });
    expect(splitAddress(3 * 4096 + 5 * 64 + 7, l1d)).toEqual({
      block: 3 * 64 + 5,
      offset: 7,
      set: 5,
      tag: 3,
    });
    // Addresses 4096 bytes apart share a set; one more line moves the set.
    expect(splitAddress(8192, l1d).set).toBe(splitAddress(0, l1d).set);
    expect(splitAddress(8192 + 64, l1d).set).toBe(1);
  });

  it('gives a fully associative cache no set bits', () => {
    const full = { lineBytes: 16, sets: 1, ways: 4 };
    expect(fieldBits(full)).toEqual({ offset: 4, set: 0 });
    expect(splitAddress(200, full)).toEqual({
      block: 12,
      offset: 8,
      set: 0,
      tag: 12,
    });
  });
});

describe('placement, LRU replacement and miss classes', () => {
  const stream = [0, 64, 0, 64, 128, 0];

  it('separates organizations with the same four-line capacity', () => {
    expect(results(stream, { lineBytes: 16, sets: 4, ways: 1 })).toEqual([
      'compulsory',
      'compulsory',
      'conflict',
      'conflict',
      'compulsory',
      'conflict',
    ]);
    expect(results(stream, { lineBytes: 16, sets: 2, ways: 2 })).toEqual([
      'compulsory',
      'compulsory',
      'hit',
      'hit',
      'compulsory',
      'conflict',
    ]);
    expect(results(stream, { lineBytes: 16, sets: 1, ways: 4 })).toEqual([
      'compulsory',
      'compulsory',
      'hit',
      'hit',
      'compulsory',
      'hit',
    ]);
  });

  it('fills the first empty way, then evicts the least recently used line', () => {
    const steps = simulateCache([0, 64, 0, 128].map(read), {
      lineBytes: 16,
      sets: 1,
      ways: 2,
    });
    expect(steps.map((s) => s.way)).toEqual([0, 1, 0, 1]);
    // Block 0 was used more recently than block 4, so block 4 is the victim.
    expect(steps[3]!.evicted).toEqual({ block: 4, dirty: false });
    // FIFO would have evicted block 0 here; LRU keeps it.
    expect(
      results([0, 64, 0, 128, 0], { lineBytes: 16, sets: 1, ways: 2 }),
    ).toEqual(['compulsory', 'compulsory', 'hit', 'compulsory', 'hit']);
  });

  it('classifies a loop larger than the cache as capacity misses', () => {
    const loop = [0, 16, 32, 48, 64, 0, 16, 32];
    const expected = [
      ...Array<string>(5).fill('compulsory'),
      ...Array<string>(3).fill('capacity'),
    ];
    // Fully associative LRU always evicts the block needed next.
    expect(results(loop, { lineBytes: 16, sets: 1, ways: 4 })).toEqual(
      expected,
    );
    // Direct mapping only evicts block 0, so blocks 1 and 2 still hit.
    expect(
      summarize(
        simulateCache(loop.map(read), { lineBytes: 16, sets: 4, ways: 1 }),
      ),
    ).toMatchObject({ hits: 2, compulsory: 5, capacity: 1, conflict: 0 });
  });

  it('returns independent snapshots and starts each trace cold', () => {
    const geometry = { lineBytes: 16, sets: 2, ways: 1 };
    const steps = simulateCache([read(0), read(16)], geometry);
    expect(steps[0]!.lines).toEqual([
      [{ block: 0, tag: 0, dirty: false, lastUse: 0 }],
      [null],
    ]);
    steps[0]!.lines[0]![0]!.block = 99;
    expect(steps[1]!.lines[0]![0]!.block).toBe(0);
    expect(simulateCache([], geometry)).toEqual([]);
    expect(simulateCache([read(0)], geometry)[0]!.hit).toBe(false);
  });
});

describe('write policies', () => {
  const geometry = { lineBytes: 16, sets: 2, ways: 2 } as const;
  const stores = [read(0), write(0), write(4), write(8), read(64), read(128)];

  it('write-back marks the line dirty and writes it once on eviction', () => {
    const steps = simulateCache(stores, geometry);
    expect(steps[1]!.lines[0]![0]!.dirty).toBe(true);
    expect(steps.map((s) => s.nextLevelWrites)).toEqual([0, 0, 0, 0, 0, 1]);
    expect(steps[5]!.evicted).toEqual({ block: 0, dirty: true });
    expect(summarize(steps)).toMatchObject({ fills: 3, nextLevelWrites: 1 });
  });

  it('write-through sends every store and keeps lines clean', () => {
    const steps = simulateCache(stores, {
      ...geometry,
      write: 'write-through',
    });
    expect(steps.map((s) => s.nextLevelWrites)).toEqual([0, 1, 1, 1, 0, 0]);
    expect(steps[5]!.evicted).toEqual({ block: 0, dirty: false });
  });

  it('write-allocate fills on a write miss; no-write-allocate writes around', () => {
    const allocate = simulateCache([write(32), read(32)], geometry);
    expect(allocate.map((s) => [s.hit, s.fills, s.way])).toEqual([
      [false, 1, 0],
      [true, 0, 0],
    ]);
    expect(allocate[0]!.nextLevelWrites).toBe(0);

    for (const policy of ['write-through', 'write-back'] as const) {
      const around = simulateCache([write(32), read(32)], {
        ...geometry,
        write: policy,
        allocate: 'no-write-allocate',
      });
      expect(around.map((s) => [s.hit, s.fills, s.nextLevelWrites])).toEqual([
        [false, 0, 1],
        [false, 1, 0],
      ]);
      expect(around[0]!.way).toBeNull();
      // The block was never in this cache, so the read miss is compulsory.
      expect(around.map((s) => s.miss)).toEqual(['compulsory', 'compulsory']);
    }
  });
});

describe('layouts on the recorded L1d geometry', () => {
  const l1d = { lineBytes: 64, sets: 64, ways: 12 };
  const columns = (rows: number, stride: number, count: number) =>
    Array.from({ length: count }, (_, column) =>
      Array.from({ length: rows }, (_, row) => read(row * stride + column * 4)),
    ).flat();

  it('pads a 64-row matrix so its columns stop sharing one set', () => {
    const sets = (stride: number) =>
      Array.from(
        { length: 8 },
        (_, row) => splitAddress(row * stride, l1d).set,
      );
    expect(sets(4096)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sets(4160)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    const crowded = simulateCache(columns(64, 4096, 2), l1d);
    expect(summarize(crowded)).toMatchObject({
      hits: 0,
      compulsory: 64,
      conflict: 64,
    });
    const padded = simulateCache(columns(64, 4160, 2), l1d);
    expect(padded.slice(0, 64).every((step) => !step.hit)).toBe(true);
    expect(padded.slice(64).every((step) => step.hit)).toBe(true);
  });

  it('classifies a 2,048-row column walk as capacity misses, padded or not', () => {
    for (const stride of [8192, 8256]) {
      const second = simulateCache(columns(2048, stride, 2), l1d).slice(2048);
      expect(summarize(second)).toMatchObject({ hits: 0, capacity: 2048 });
    }
  });

  it('crowds 16 arrays 64 KiB apart into one set until their starts are staggered', () => {
    const lockstep = (offset: number) =>
      Array.from({ length: 32 }, (_, i) =>
        Array.from({ length: 16 }, (_, array) =>
          read(array * 65536 + array * offset + i * 4),
        ),
      ).flat();
    // 512 reads touch 32 lines; staggering leaves only their compulsory misses.
    expect(summarize(simulateCache(lockstep(0), l1d))).toMatchObject({
      hits: 0,
      compulsory: 32,
    });
    expect(summarize(simulateCache(lockstep(64), l1d))).toMatchObject({
      misses: 32,
      compulsory: 32,
      conflict: 0,
    });
  });
});

describe('validation and displayed output', () => {
  it('rejects invalid geometry, addresses and access kinds', () => {
    for (const lineBytes of [0, 3, 24, 8192, 1.5, NaN])
      expect(() => simulateCache([], { lineBytes, sets: 1, ways: 1 })).toThrow(
        RangeError,
      );
    for (const sets of [0, 6, -2])
      expect(() => simulateCache([], { lineBytes: 16, sets, ways: 1 })).toThrow(
        RangeError,
      );
    for (const ways of [0, 65, 2.5])
      expect(() => simulateCache([], { lineBytes: 16, sets: 1, ways })).toThrow(
        RangeError,
      );
    for (const address of [-1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1])
      expect(() =>
        simulateCache([read(address)], { lineBytes: 16, sets: 1, ways: 1 }),
      ).toThrow(RangeError);
    expect(() =>
      simulateCache(
        [{ kind: 'fetch', address: 0 } as unknown as ReturnType<typeof read>],
        { lineBytes: 16, sets: 1, ways: 1 },
      ),
    ).toThrow(RangeError);
  });

  it('checks the exact output displayed by the lesson', () => {
    expect(cacheOrganizationExample()).toBe(
      [
        'direct-mapped 4x1: miss miss miss miss miss miss | 3 compulsory, 3 conflict',
        '2-way 2x2: miss miss hit hit miss miss | 3 compulsory, 1 conflict',
        'fully associative 1x4: miss miss hit hit miss hit | 3 compulsory, 0 conflict',
        '8 stores, write-through: next-level writes = 8',
        '8 stores, write-back: next-level writes = 1',
      ].join('\n'),
    );
  });
});
