import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseListing } from '../reading-assembly/x86';
import {
  SCALE_NAMES,
  SUM_CONSTANTS,
  SUM_NAMES,
  frameSlots,
  realFrames,
} from './frames';

const listing = (file: string) =>
  parseListing(
    readFileSync(
      `labs/computer-architecture-execution/reading-assembly/${file}`,
      'utf8',
    ),
  );
const scaleO0 = listing('scale-O0.txt');
const sumO0 = listing('sum-O0.txt');

it('names -O0 frame slots from the prologue stores', () => {
  expect(frameSlots(scaleO0, SCALE_NAMES)).toEqual([
    { offset: -8, bytes: 8, name: 'values', from: '%rdi' },
    { offset: -12, bytes: 4, name: 'count', from: '%esi' },
    { offset: -16, bytes: 4, name: 'factor', from: '%edx' },
  ]);
  expect(frameSlots(sumO0, SUM_NAMES, SUM_CONSTANTS)).toEqual([
    { offset: -24, bytes: 8, name: 'values', from: '%rdi' },
    { offset: -28, bytes: 4, name: 'count', from: '%esi' },
    { offset: -8, bytes: 4, name: 'total', from: '$0' },
    { offset: -4, bytes: 4, name: 'i', from: '$0' },
  ]);
});

it('reads both frames while sum_to runs, highest address first', () => {
  const rows = realFrames(scaleO0, sumO0);
  expect(rows.map((r) => [r.frame, r.label, r.value, r.belowRsp])).toEqual([
    ['scale_sum', 'rbp+8', 'return address → the caller', false],
    ['scale_sum', 'rbp', "saved rbp of scale_sum's caller", false],
    ['scale_sum', 'rbp-8', 'values = 0x5000, stored from %rdi', false],
    ['scale_sum', 'rbp-12', 'count = 4, stored from %esi', false],
    ['scale_sum', 'rbp-16', 'factor = 2, stored from %edx', false],
    [
      'sum_to',
      'rbp+8',
      'return address → scale_sum, at imull -16(%rbp), %eax',
      false,
    ],
    ['sum_to', 'rbp', "saved rbp = scale_sum's rbp", false],
    // sum_to is a leaf: it never moves rsp, so its locals sit in the red zone.
    ['sum_to', 'rbp-4', 'i = 0, stored from $0', true],
    ['sum_to', 'rbp-8', 'total = 0, stored from $0', true],
    ['sum_to', 'rbp-24', 'values = 0x5000, stored from %rdi', true],
    ['sum_to', 'rbp-28', 'count = 4, stored from %esi', true],
  ]);
  // Frames are adjacent: sum_to's return address sits just below scale_sum's rsp.
  const scaleLowest = rows.filter((r) => r.frame === 'scale_sum').at(-1)!;
  const sumReturn = rows.find((r) => r.frame === 'sum_to')!;
  expect(scaleLowest.address - sumReturn.address).toBe(8n);
});
