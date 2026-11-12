// Illustrative 16-bit encoding: 4-bit opcode, 4-bit register, 8-bit immediate.
// Opcodes 1 and 2 mean set and add in this teaching format only.
export interface EncodedOperation {
  opcode: 1 | 2;
  register: number;
  immediate: number;
}

function unsigned(value: number, limit: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= limit) {
    throw new RangeError(`${label} is outside its encoding range`);
  }
}

export function encode({
  opcode,
  register,
  immediate,
}: EncodedOperation): number {
  if (opcode !== 1 && opcode !== 2) throw new RangeError('Unknown opcode');
  unsigned(register, 16, 'register');
  unsigned(immediate, 256, 'immediate');
  return (opcode << 12) | (register << 8) | immediate;
}

export function decode(word: number): EncodedOperation {
  unsigned(word, 65536, 'word');
  const opcode = word >>> 12;
  if (opcode !== 1 && opcode !== 2) throw new RangeError('Unknown opcode');
  return { opcode, register: (word >>> 8) & 15, immediate: word & 255 };
}

export function registerExample(): string {
  const word = encode({ opcode: 2, register: 3, immediate: 17 });
  const decoded = decode(word);
  return `word: 0x${word.toString(16)}\nopcode: ${decoded.opcode}\nregister: ${decoded.register}\nimmediate: ${decoded.immediate}`;
}
