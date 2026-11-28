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

export function cacheExample(): string {
  return traceCache([0, 4, 8, 12, 32, 0], 16, 2)
    .map(
      ({ address, block, slot, result }) =>
        `read ${address}: block ${block}, slot ${slot}, ${result}`,
    )
    .join('\n');
}
