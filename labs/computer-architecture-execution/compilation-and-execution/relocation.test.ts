import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseLinked, parseObjectCall, pc32 } from './relocation';

const native =
  'labs/computer-architecture-execution/compilation-and-execution/native';
const object = parseObjectCall(
  readFileSync(`${native}/scale-object.txt`, 'utf8'),
);
const linked = parseLinked(
  readFileSync(`${native}/scale-linked.txt`, 'utf8'),
  'scale_sum',
);

it('reads the placeholder call and its relocation from the object file', () => {
  expect(object).toEqual({
    at: 7,
    bytes: [0xe8, 0, 0, 0, 0],
    relocation: {
      offset: 8,
      type: 'R_X86_64_PLT32',
      symbol: 'sum_to',
      addend: -4,
    },
  });
});

it('reproduces the bytes the linker wrote: S + A − P', () => {
  const base = linked.symbols.scale_sum!;
  const place = base + object.relocation.offset;
  const patch = pc32(linked.symbols.sum_to!, object.relocation.addend, place);
  expect(linked.bytes).toEqual([0xe8, ...patch]);
  expect(patch).toEqual([0xb4, 0xff, 0xff, 0xff]);
  // The CPU adds the displacement to the next instruction's address.
  const next = linked.at + linked.bytes.length;
  const displacement = new DataView(new Uint8Array(patch).buffer).getInt32(
    0,
    true,
  );
  expect(next + displacement).toBe(linked.symbols.sum_to);
  expect(linked.target).toBe(linked.symbols.sum_to);
  expect(linked.at).toBe(base + object.at);
});

it('rejects displacements that do not fit in 32 bits', () => {
  expect(pc32(0x1000, -4, 0x0ffc)).toEqual([0, 0, 0, 0]);
  expect(() => pc32(2 ** 32, 0, 0)).toThrow(RangeError);
  expect(() => pc32(0.5, 0, 0)).toThrow(RangeError);
});
