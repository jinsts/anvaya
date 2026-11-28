import { describe, expect, it } from 'vitest';
import { FIELDS, OPCODES, decode, encode, registerExample } from './example';

describe('teaching instruction encoding', () => {
  it('checks the displayed word and all decoded fields', () => {
    expect(registerExample()).toBe(
      'word: 0x2311\nopcode: 2\nregister: 3\nimmediate: 17',
    );
  });

  it('round-trips all 8192 valid instructions without overlapping fields', () => {
    for (const opcode of [1, 2] as const) {
      for (let register = 0; register < 16; register += 1) {
        for (let immediate = 0; immediate < 256; immediate += 1) {
          const operation = { opcode, register, immediate };
          expect(decode(encode(operation))).toEqual(operation);
        }
      }
    }
  });

  it('lays out the fields the figure draws, most significant first', () => {
    expect(FIELDS.reduce((sum, field) => sum + field.bits, 0)).toBe(16);
    for (const opcode of [1, 2] as const) {
      for (let register = 0; register < 16; register += 1) {
        for (let immediate = 0; immediate < 256; immediate += 1) {
          const word = encode({ opcode, register, immediate });
          const decoded = decode(word);
          let shift = 16;
          for (const field of FIELDS) {
            shift -= field.bits;
            expect((word >>> shift) & (2 ** field.bits - 1)).toBe(
              decoded[field.name],
            );
          }
        }
      }
    }
    expect(Object.keys(OPCODES)).toEqual(['1', '2']);
    for (let opcode = 0; opcode < 2 ** FIELDS[0].bits; opcode += 1) {
      if (opcode in OPCODES) continue;
      expect(() => decode(opcode << (16 - FIELDS[0].bits))).toThrow('opcode');
    }
  });

  it('rejects fields that would corrupt adjacent bits', () => {
    for (const register of [-1, 16, 0.5, NaN]) {
      expect(() => encode({ opcode: 1, register, immediate: 0 })).toThrow(
        'register',
      );
    }
    for (const immediate of [-1, 256, 0.5, Infinity]) {
      expect(() => encode({ opcode: 1, register: 0, immediate })).toThrow(
        'immediate',
      );
    }
  });

  it('rejects out-of-range words and reserved opcodes', () => {
    for (const word of [-1, 65536, 0.5, NaN]) {
      expect(() => decode(word)).toThrow('word');
    }
    for (const word of [0, 0x3000, 0xffff]) {
      expect(() => decode(word)).toThrow('opcode');
    }
  });
});
