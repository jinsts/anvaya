import { describe, expect, it } from 'vitest';
import {
  addBytes,
  bitAt,
  layoutRecord,
  representationExample,
  signedByte,
  wordBytes,
} from './example';

describe('an explicit eight-bit arithmetic model', () => {
  it('checks the complete byte domain against the two’s complement definition', () => {
    for (let raw = 0; raw < 256; raw++) {
      expect(signedByte(raw)).toBe(raw < 128 ? raw : raw - 256);
    }
  });

  it('distinguishes unsigned carry from signed overflow', () => {
    expect(addBytes(255, 1)).toEqual({
      unsigned: 0,
      signed: 0,
      carry: true,
      signedOverflow: false,
    });
    expect(addBytes(128, 255)).toEqual({
      unsigned: 127,
      signed: 127,
      carry: true,
      signedOverflow: true,
    });
    expect(addBytes(2, 3)).toEqual({
      unsigned: 5,
      signed: 5,
      carry: false,
      signedOverflow: false,
    });
  });

  it.each([-1, 256, 1.5, NaN, Infinity])('rejects invalid byte %s', (raw) => {
    expect(() => signedByte(raw)).toThrow(RangeError);
    expect(() => addBytes(raw, 0)).toThrow(RangeError);
    expect(() => addBytes(0, raw)).toThrow(RangeError);
  });

  it('serializes both endian orders and the word boundaries', () => {
    expect(wordBytes(0x1234, false)).toEqual([0x12, 0x34]);
    expect(wordBytes(0x1234, true)).toEqual([0x34, 0x12]);
    expect(wordBytes(0, true)).toEqual([0, 0]);
    expect(wordBytes(65535, false)).toEqual([255, 255]);
    for (const value of [-1, 65536, 0.5, NaN]) {
      expect(() => wordBytes(value, true)).toThrow(RangeError);
    }
  });

  it('extracts bits without changing the input interpretation', () => {
    expect(Array.from({ length: 8 }, (_, index) => bitAt(0x81, index))).toEqual(
      [1, 0, 0, 0, 0, 0, 0, 1],
    );
    for (const position of [-1, 8, 0.5, NaN]) {
      expect(() => bitAt(1, position)).toThrow(RangeError);
    }
    expect(() => bitAt(256, 0)).toThrow(RangeError);
  });

  it('accounts for interior and trailing padding under explicit layout rules', () => {
    expect(layoutRecord([])).toEqual({ offsets: [], size: 0, paddingBytes: 0 });
    expect(
      layoutRecord([
        { bytes: 4, alignment: 4 },
        { bytes: 1, alignment: 1 },
        { bytes: 1, alignment: 1 },
      ]),
    ).toEqual({ offsets: [0, 4, 5], size: 8, paddingBytes: 2 });
    expect(() => layoutRecord([{ bytes: 1, alignment: 3 }])).toThrow(
      RangeError,
    );
    expect(() => layoutRecord([{ bytes: -1, alignment: 1 }])).toThrow(
      RangeError,
    );
    expect(() =>
      layoutRecord([
        { bytes: Number.MAX_SAFE_INTEGER, alignment: 1 },
        { bytes: 1, alignment: 1 },
      ]),
    ).toThrow(RangeError);
  });

  it('checks the exact output displayed by the lesson', () => {
    expect(representationExample()).toBe(
      '255 as signed byte: -1\n' +
        '127 + 1: {"unsigned":128,"signed":-128,"carry":false,"signedOverflow":true}\n' +
        '0x1234 little-endian: 52, 18\n' +
        '0.1 + 0.2: 0.30000000000000004\n' +
        'record: {"offsets":[0,4,8],"size":12,"paddingBytes":6}',
    );
  });
});
