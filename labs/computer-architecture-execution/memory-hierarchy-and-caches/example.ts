export type CacheAccess = {
  address: number;
  block: number;
  slot: number;
  result: 'hit' | 'miss';
};

function positiveInteger(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError('Expected a positive safe integer.');
  }
}

// Cold, direct-mapped, read-only cache. Addresses are explicit model inputs.
// Every miss fills a whole line; there is no prefetching or overlapping work.
export function traceCache(
  addresses: readonly number[],
  lineBytes: number,
  lineCount: number,
): CacheAccess[] {
  positiveInteger(lineBytes);
  positiveInteger(lineCount);
  const tags = new Map<number, number>();
  return addresses.map((address) => {
    if (!Number.isSafeInteger(address) || address < 0) {
      throw new RangeError('Expected a nonnegative safe byte address.');
    }
    const block = Math.floor(address / lineBytes);
    const slot = block % lineCount;
    const result = tags.get(slot) === block ? 'hit' : 'miss';
    tags.set(slot, block);
    return { address, block, slot, result };
  });
}

export function averageAccessTime(
  hitTime: number,
  missRate: number,
  additionalMissPenalty: number,
): number {
  if (
    !Number.isFinite(hitTime) ||
    hitTime < 0 ||
    !Number.isFinite(additionalMissPenalty) ||
    additionalMissPenalty < 0 ||
    !Number.isFinite(missRate) ||
    missRate < 0 ||
    missRate > 1
  ) {
    throw new RangeError(
      'Expected nonnegative times and a miss rate in [0, 1].',
    );
  }
  return hitTime + missRate * additionalMissPenalty;
}

export function cacheExample(): string {
  const trace = traceCache([0, 4, 8, 12, 32, 0], 16, 2);
  return [
    trace.map((access) => access.result).join(' '),
    `average model time: ${averageAccessTime(1, 0.1, 50)} ns`,
  ].join('\n');
}
