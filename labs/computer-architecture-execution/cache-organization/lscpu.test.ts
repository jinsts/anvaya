import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { fieldBits } from './example';

// `lscpu --caches` recorded on the machine used for this subject's measurements.
const recorded = readFileSync(
  'labs/computer-architecture-execution/cache-organization/lscpu-caches.txt',
  'utf8',
);
const bytes = (size: string) => {
  const match = /^(\d+)([KMG])$/.exec(size);
  if (!match) throw new Error(`Unexpected size ${size}`);
  return Number(match[1]) * 1024 ** ' KMG'.indexOf(match[2]!);
};

it('derives each recorded set count from size, ways and line size', () => {
  const rows = recorded
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/));
  expect(rows.map((row) => row[0])).toEqual(['L1d', 'L1i', 'L2', 'L3']);
  for (const [, oneSize, , ways, , , sets, , lineBytes] of rows) {
    const derived = bytes(oneSize!) / (Number(ways) * Number(lineBytes));
    expect(derived).toBe(Number(sets));
  }
  // The L1d example in the lesson: 64 sets of 64-byte lines.
  expect(fieldBits({ lineBytes: 64, sets: 64, ways: 12 })).toEqual({
    offset: 6,
    set: 6,
  });
});
