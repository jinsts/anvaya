import { expect, it } from 'vitest';
import {
  bitsOf,
  decode,
  exactDecimal,
  exactDecimal64,
  floatExample,
  fromBits,
  kahanFloat32,
  nextDown,
  nextUp,
  spacing,
  sumFloat32,
  toggleBit,
  toyBinade,
} from './example';

it('splits binary32 patterns into sign, exponent and fraction', () => {
  expect(decode(0x40d00000)).toEqual({
    bits: 0x40d00000,
    sign: 0,
    exponent: 129,
    fraction: 0x500000,
    kind: 'normal',
    scale: 2,
    value: 6.5,
  });
  expect(decode(bitsOf(0.1))).toMatchObject({
    exponent: 123,
    fraction: 0x4ccccd,
    scale: -4,
  });
  expect(decode(0xbe200000).value).toBe(-0.15625);
});

it('classifies zeros, subnormals, infinities and NaN by the exponent field', () => {
  expect(decode(0x00000000).kind).toBe('zero');
  expect(Object.is(decode(0x80000000).value, -0)).toBe(true);
  expect(decode(0x00000001)).toMatchObject({
    kind: 'subnormal',
    scale: -126,
    value: 2 ** -149,
  });
  expect(decode(0x00800000)).toMatchObject({
    kind: 'normal',
    value: 2 ** -126,
  });
  expect(decode(0x7f800000).kind).toBe('infinity');
  expect(decode(0xff800000).value).toBe(-Infinity);
  expect(decode(0x7fc00000).kind).toBe('nan');
  expect(decode(0x7f800001).kind).toBe('nan');
});

it('prints the exact stored value, not a rounded display', () => {
  expect(exactDecimal(bitsOf(0.1))).toBe('0.100000001490116119384765625');
  expect(exactDecimal(0x7f7fffff)).toBe(
    '340282346638528859811704183484516925440',
  );
  expect(exactDecimal(0x00000001)).toMatch(/^0\.0{44}1401298464324817070923/);
  expect(exactDecimal(0x80000000)).toBe('-0');
  expect(exactDecimal(0xff800000)).toBe('-Infinity');
  expect(exactDecimal(0x7fc00000)).toBe('NaN');
  expect(exactDecimal64(0.1)).toBe(
    '0.1000000000000000055511151231257827021181583404541015625',
  );
  expect(exactDecimal64(0.1 + 0.2)).toBe(
    '0.3000000000000000444089209850062616169452667236328125',
  );
});

it('steps to neighboring values and doubles the spacing at each power of two', () => {
  expect(fromBits(nextUp(bitsOf(1)))).toBe(1 + 2 ** -23);
  expect(fromBits(nextDown(bitsOf(1)))).toBe(1 - 2 ** -24);
  expect(fromBits(nextUp(bitsOf(-1)))).toBe(-(1 - 2 ** -24));
  expect(fromBits(nextUp(0x80000000))).toBe(2 ** -149);
  expect(fromBits(nextUp(0x7f7fffff))).toBe(Infinity);
  expect(nextUp(0x7f800000)).toBe(0x7f800000);
  expect([1, 1024, 2 ** 20, 2 ** 24].map(spacing)).toEqual([
    2 ** -23,
    2 ** -13,
    0.125,
    2,
  ]);
  expect(spacing(1.5)).toBe(spacing(1));
  expect(spacing(2)).toBe(2 * spacing(1));
  expect(() => spacing(Infinity)).toThrow(RangeError);
  expect(() => spacing(3.4028234663852886e38)).toThrow(RangeError);
});

it('rounds halfway cases to the neighbor with an even last bit', () => {
  // 2^24 + 1 is halfway between 2^24 (even fraction) and 2^24 + 2 (odd).
  expect(Math.fround(2 ** 24 + 1)).toBe(2 ** 24);
  expect(Math.fround(2 ** 24 + 3)).toBe(2 ** 24 + 4);
  expect(bitsOf(2 ** 24) & 1).toBe(0);
  expect(bitsOf(2 ** 24 + 4) & 1).toBe(0);
  expect(Math.fround(1 + 2 ** -24)).toBe(1);
  expect(Math.fround(1 + 3 * 2 ** -24)).toBe(1 + 2 ** -22);
});

it('toggles single bits', () => {
  expect(fromBits(toggleBit(bitsOf(1), 31))).toBe(-1);
  expect(fromBits(toggleBit(bitsOf(1), 23))).toBe(0.5);
  expect(fromBits(toggleBit(bitsOf(1), 0))).toBe(1 + 2 ** -23);
  expect(() => toggleBit(0, 32)).toThrow(RangeError);
  expect(() => decode(2 ** 32)).toThrow(RangeError);
  expect(() => decode(-1)).toThrow(RangeError);
});

it('loses small addends when the total is large, depending on order', () => {
  const ones = [2 ** 24, 1, 1, 1, 1];
  const largeFirst = sumFloat32(ones);
  expect(largeFirst.total).toBe(2 ** 24);
  // Each step's binary64 sum is exact; only the binary32 rounding loses the 1.
  expect(largeFirst.steps.slice(1).map((s) => [s.wide, s.stored])).toEqual(
    Array(4).fill([2 ** 24 + 1, 2 ** 24]),
  );
  expect(sumFloat32([1, 1, 1, 1, 2 ** 24]).total).toBe(2 ** 24 + 4);
  expect(kahanFloat32(ones)).toBe(2 ** 24 + 4);
  const hundred = [2 ** 24, ...Array<number>(100).fill(1)];
  expect(sumFloat32(hundred).total).toBe(2 ** 24);
  expect(kahanFloat32(hundred)).toBe(2 ** 24 + 100);
  expect(() => sumFloat32([0.1])).toThrow(RangeError);
  // binary64 addition is not associative either.
  expect(0.1 + 0.2 + 0.3).not.toBe(0.1 + (0.2 + 0.3));
});

it('backs the answers to the summation exercise', () => {
  let tenth = 0;
  for (let i = 0; i < 10; i++) tenth += 0.1;
  expect(tenth).toBe(0.9999999999999999);
  expect(sumFloat32([2 ** 25, 1, 1, 1, 1]).total).toBe(2 ** 25);
  expect(sumFloat32([1, 1, 1, 1, 2 ** 25]).total).toBe(2 ** 25 + 4);
  expect(spacing(2 ** 25)).toBe(4);
});

it('builds toy binades whose spacing doubles with each power of two', () => {
  expect(toyBinade(3, 0)).toEqual([
    1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875,
  ]);
  const gap = (values: number[]) => values[1]! - values[0]!;
  expect([0, 1, 2].map((p) => gap(toyBinade(3, p)))).toEqual([
    0.125, 0.25, 0.5,
  ]);
  expect(() => toyBinade(0, 0)).toThrow(RangeError);
});

it('prints the lesson output', () => {
  expect(floatExample()).toBe(
    [
      '0.1 as binary32: 3dcccccd = 0.100000001490116119384765625',
      'next after 16777216: 16777218',
      '16777217 is stored as 16777216',
      'large first: 16777216',
      'small first: 16777220',
      'compensated: 16777220',
      '(0.1 + 0.2) + 0.3 = 0.6000000000000001; 0.1 + (0.2 + 0.3) = 0.6',
    ].join('\n'),
  );
});
