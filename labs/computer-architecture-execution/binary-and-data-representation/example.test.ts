import { describe, expect, it } from 'vitest';
import {
  addBytes,
  addPatterns,
  bitAt,
  extendByte,
  representationExample,
  shiftRightByte,
  signedByte,
  signedValue,
  wheel,
} from './example';

describe('an explicit fixed-width integer model', () => {
  it('checks the complete byte domain against the two’s complement definition', () => {
    for (let raw = 0; raw < 256; raw++) {
      expect(signedByte(raw)).toBe(raw < 128 ? raw : raw - 256);
      // Weighted-bit definition: bit 7 weighs −128.
      let weighted = -128 * bitAt(raw, 7);
      for (let k = 0; k < 7; k++) weighted += bitAt(raw, k) * 2 ** k;
      expect(signedByte(raw)).toBe(weighted);
    }
  });

  it('matches the sign rule for overflow and the carry-out for every byte pair', () => {
    for (let a = 0; a < 256; a++)
      for (let b = 0; b < 256; b++) {
        const result = addBytes(a, b);
        const sign = (x: number) => x >> 7;
        // Overflow: both operands share a sign that the result lacks.
        expect(result.signedOverflow).toBe(
          sign(a) === sign(b) && sign(result.unsigned) !== sign(a),
        );
        expect(result.carry).toBe(a + b > 255);
        expect(result.unsigned).toBe((a + b) & 0xff);
      }
  });

  it('shows all four carry/overflow combinations', () => {
    expect(addBytes(1, 2)).toMatchObject({
      carry: false,
      signedOverflow: false,
    });
    expect(addBytes(255, 1)).toEqual({
      unsigned: 0,
      signed: 0,
      carry: true,
      signedOverflow: false,
    });
    expect(addBytes(127, 1)).toMatchObject({
      unsigned: 128,
      signed: -128,
      carry: false,
      signedOverflow: true,
    });
    expect(addBytes(128, 128)).toMatchObject({
      unsigned: 0,
      carry: true,
      signedOverflow: true,
    });
    // The practice answers.
    expect(addBytes(200, 100)).toMatchObject({
      unsigned: 44,
      carry: true,
      signedOverflow: false,
    });
    expect(addBytes(100, 100)).toMatchObject({
      unsigned: 200,
      signed: -56,
      carry: false,
      signedOverflow: true,
    });
  });

  it('builds a four-bit wheel whose two breaks are the carry and overflow points', () => {
    const four = wheel(4);
    expect(four).toHaveLength(16);
    expect(four[7]).toEqual({ raw: 7, bits: '0111', unsigned: 7, signed: 7 });
    expect(four[8]).toEqual({ raw: 8, bits: '1000', unsigned: 8, signed: -8 });
    expect(addPatterns(7, 1, 4)).toMatchObject({
      carry: false,
      signedOverflow: true,
    });
    expect(addPatterns(15, 1, 4)).toMatchObject({
      carry: true,
      signedOverflow: false,
    });
    expect(signedValue(15, 4)).toBe(-1);
  });

  it('extends and shifts with explicit fill bits', () => {
    expect(extendByte(0xff, 'sign')).toBe(0xffff);
    expect(extendByte(0xff, 'zero')).toBe(0x00ff);
    expect(extendByte(0x7f, 'sign')).toBe(0x007f);
    for (let raw = 0; raw < 256; raw++) {
      // Sign extension preserves the signed value; zero extension the unsigned.
      expect(signedValue(extendByte(raw, 'sign'), 16)).toBe(signedByte(raw));
      expect(extendByte(raw, 'zero')).toBe(raw);
      for (let by = 0; by < 8; by++) {
        expect(shiftRightByte(raw, by, 'logical')).toBe(raw >> by);
        expect(signedByte(shiftRightByte(raw, by, 'arithmetic'))).toBe(
          signedByte(raw) >> by,
        );
      }
    }
    expect(() => shiftRightByte(1, 8, 'logical')).toThrow(RangeError);
    // −7 >> 1 rounds toward −∞; C's -7 / 2 truncates toward zero to −3.
    expect(signedByte(shiftRightByte(0xf9, 1, 'arithmetic'))).toBe(-4);
    expect(Math.trunc(-7 / 2)).toBe(-3);
  });

  it('extracts bits and rejects invalid input', () => {
    expect(Array.from({ length: 8 }, (_, index) => bitAt(0x81, index))).toEqual(
      [1, 0, 0, 0, 0, 0, 0, 1],
    );
    for (const position of [-1, 8, 0.5, NaN])
      expect(() => bitAt(1, position)).toThrow(RangeError);
    for (const raw of [-1, 256, 1.5, NaN, Infinity]) {
      expect(() => signedByte(raw)).toThrow(RangeError);
      expect(() => addBytes(raw, 0)).toThrow(RangeError);
      expect(() => addBytes(0, raw)).toThrow(RangeError);
    }
    expect(() => wheel(0)).toThrow(RangeError);
    expect(() => signedValue(16, 4)).toThrow(RangeError);
  });

  it('checks the exact output displayed by the lesson', () => {
    expect(representationExample()).toBe(
      '255 as signed byte: -1\n' +
        '127 + 1: {"unsigned":128,"signed":-128,"carry":false,"signedOverflow":true}\n' +
        '255 + 1: {"unsigned":0,"signed":0,"carry":true,"signedOverflow":false}\n' +
        '0xf0 sign-extended: 0xfff0; zero-extended: 0x00f0\n' +
        '0x96 >> 2: logical 0x25, arithmetic 0xe5',
    );
  });
});
