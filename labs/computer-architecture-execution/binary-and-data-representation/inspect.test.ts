import { expect, it } from 'vitest';
import { floatBits, textUnits } from './inspect';
it('inspects explicit binary32 fields and special values', () => {
  expect(floatBits(6.5)).toBe('01000000110100000000000000000000');
  expect(floatBits(-0)).toBe('10000000000000000000000000000000');
  expect(floatBits(Infinity)).toBe('01111111100000000000000000000000');
  expect(floatBits(1 + 2 ** -24)).toBe(floatBits(1));
  expect(floatBits(1 + 2 ** -23)).not.toBe(floatBits(1));
});
it('distinguishes bytes, code units, points and graphemes', () => {
  expect(textUnits('🙂e\u0301')).toEqual({
    bytes: 7,
    units: 4,
    points: 3,
    graphemes: 2,
  });
  expect(textUnits('')).toEqual({
    bytes: 0,
    units: 0,
    points: 0,
    graphemes: 0,
  });
});
