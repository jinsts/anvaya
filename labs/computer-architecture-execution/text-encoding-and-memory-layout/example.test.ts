import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  DECLARED,
  byAlignment,
  bytesInOrder,
  layoutExample,
  layoutRecord,
  textLadder,
  textUnits,
  utf16Units,
  utf8Bytes,
} from './example';

// Output of representation.c on the recorded x86-64 Linux target.
const recorded = Object.fromEntries(
  readFileSync(
    'labs/computer-architecture-execution/text-encoding-and-memory-layout/representation-output.txt',
    'utf8',
  )
    .trim()
    .split('\n')
    .map((line) => {
      const colon = line.indexOf(':');
      return [line.slice(0, colon), line.slice(colon + 1).trim()];
    }),
);
const hex = (bytes: number[]) =>
  bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');

it('encodes every UTF-8 length boundary like TextEncoder', () => {
  const encoder = new TextEncoder();
  for (const codePoint of [
    0, 0x41, 0x7f, 0x80, 0xe9, 0x7ff, 0x800, 0x20ac, 0xd7ff, 0xe000, 0xffff,
    0x10000, 0x1f642, 0x10ffff,
  ]) {
    const expected = [...encoder.encode(String.fromCodePoint(codePoint))];
    expect(utf8Bytes(codePoint).map((b) => b.value)).toEqual(expected);
  }
  expect(utf8Bytes(0x20ac)).toEqual([
    { value: 0xe2, prefix: '1110', payload: '0010' },
    { value: 0x82, prefix: '10', payload: '000010' },
    { value: 0xac, prefix: '10', payload: '101100' },
  ]);
  expect(() => utf8Bytes(0xd800)).toThrow(RangeError);
  expect(() => utf8Bytes(0x110000)).toThrow(RangeError);
  expect(() => utf8Bytes(-1)).toThrow(RangeError);
});

it('splits supplementary code points into UTF-16 surrogate pairs', () => {
  for (const codePoint of [0x41, 0xffff, 0x10000, 0x1f642, 0x10ffff]) {
    const units = String.fromCodePoint(codePoint);
    expect(utf16Units(codePoint)).toEqual(
      [...units].flatMap((c) =>
        Array.from({ length: c.length }, (_, i) => c.charCodeAt(i)),
      ),
    );
  }
  expect(utf16Units(0x1f642)).toEqual([0xd83d, 0xde42]);
});

it('counts one string four ways and matches the native UTF-8 bytes', () => {
  const text = 'A\u{1F642}é';
  expect(textUnits(text)).toEqual({
    bytes: 8,
    units: 5,
    points: 4,
    graphemes: 3,
  });
  expect(text.length).toBe(5);
  const ladder = textLadder(text);
  expect(ladder.map((g) => g.points.length)).toEqual([1, 1, 2]);
  expect(hex(ladder.flatMap((g) => g.points.flatMap((p) => p.utf8)))).toBe(
    recorded['utf8 A U+1F642 e U+0301'],
  );
  expect(textUnits('')).toEqual({
    bytes: 0,
    units: 0,
    points: 0,
    graphemes: 0,
  });
  // The concept check: precomposed é, so six graphemes in ten bytes.
  expect(textUnits('héllo\u{1F642}')).toEqual({
    bytes: 10,
    units: 7,
    points: 6,
    graphemes: 6,
  });
});

it('orders bytes by address and matches the recorded little-endian target', () => {
  expect(bytesInOrder(0x12345678, 4, 'big')).toEqual([0x12, 0x34, 0x56, 0x78]);
  expect(hex(bytesInOrder(0x12345678, 4, 'little'))).toBe(
    recorded['uint32 0x12345678'],
  );
  expect(bytesInOrder(0x1234, 2, 'little')).toEqual([0x34, 0x12]);
  // The opening example: big-endian bytes read as a little-endian value.
  const misread = new DataView(new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer);
  expect(misread.getUint32(0, true)).toBe(0x78563412);
  expect([0x78563412, 0x12345678]).toEqual([2018915346, 305419896]);
  expect(() => bytesInOrder(2 ** 32, 4, 'big')).toThrow(RangeError);
  expect(() => bytesInOrder(-1, 2, 'big')).toThrow(RangeError);
  // The float lesson's 0.1 pattern, 0x3dcccccd, in little-endian order.
  expect(hex(bytesInOrder(0x3dcccccd, 4, 'little'))).toBe(
    recorded['float 0.1f'],
  );
});

it('lays out records like the x86-64 ABI, padding included', () => {
  const declared = layoutRecord(DECLARED);
  const reordered = layoutRecord(byAlignment(DECLARED));
  const native = (line: string) => {
    const [, size, align, fields] = line.match(/size (\d+) align (\d+) (.*)/)!;
    return { size: Number(size), align: Number(align), fields };
  };
  const offsets = (r: ReturnType<typeof layoutRecord>) =>
    r.fields.map((f) => `${f.name}@${f.offset}`).join(' ');
  expect({
    size: declared.size,
    align: declared.alignment,
    fields: offsets(declared),
  }).toEqual(native(recorded['declared']!));
  expect({
    size: reordered.size,
    align: reordered.alignment,
    fields: offsets(reordered),
  }).toEqual(native(recorded['reordered']!));
  expect(declared.padding).toEqual([
    { offset: 1, size: 7 },
    { offset: 17, size: 3 },
  ]);
  expect(declared.paddingBytes).toBe(10);
  expect(reordered.padding).toEqual([{ offset: 14, size: 2 }]);
});

it('backs the second exercise and rejects invalid fields', () => {
  const small = layoutRecord([
    { name: 'a', size: 1, alignment: 1 },
    { name: 'b', size: 2, alignment: 2 },
    { name: 'c', size: 1, alignment: 1 },
    { name: 'd', size: 8, alignment: 8 },
  ]);
  expect([small.size, small.paddingBytes]).toEqual([16, 4]);
  const sorted = layoutRecord(byAlignment(small.fields));
  expect(sorted.fields.map((f) => [f.name, f.offset])).toEqual([
    ['d', 0],
    ['b', 8],
    ['a', 10],
    ['c', 11],
  ]);
  expect([sorted.size, sorted.paddingBytes]).toEqual([16, 4]);
  expect(layoutRecord([]).size).toBe(0);
  expect(() => layoutRecord([{ name: 'x', size: 4, alignment: 3 }])).toThrow(
    RangeError,
  );
  expect(() =>
    layoutRecord([
      { name: 'x', size: 1, alignment: 1 },
      { name: 'x', size: 1, alignment: 1 },
    ]),
  ).toThrow(RangeError);
});

it('prints the lesson output', () => {
  expect(layoutExample()).toBe(
    [
      'U+20AC in UTF-8: e2 82 ac',
      'counts: {"bytes":8,"units":5,"points":4,"graphemes":3}',
      '0x12345678 little-endian: 78 56 34 12',
      '0x12345678 big-endian: 12 34 56 78',
      'declared: size 24, padding 10, tag@0 ratio@8 flag@16 count@20',
      'reordered: size 16, padding 2, ratio@0 count@8 tag@12 flag@13',
    ].join('\n'),
  );
});
