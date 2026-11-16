// Reads the recorded objdump output for scale_sum before and after linking,
// and computes the PC-relative patch the linker applies. For x86-64
// R_X86_64_PLT32 and R_X86_64_PC32 the stored value is S + A − P: the
// symbol's address, plus the addend, minus the address of the patched bytes.

export interface ObjectCall {
  /** Offset of the call instruction within the function. */
  at: number;
  bytes: number[];
  relocation: { offset: number; type: string; symbol: string; addend: number };
}

const bytesOf = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .map((b) => parseInt(b, 16));

/** The call and its relocation record in `objdump -dr` of an object file. */
export function parseObjectCall(text: string): ObjectCall {
  const call = /^\s*([0-9a-f]+):\s+((?:[0-9a-f]{2} )+)\s*\tcall/m.exec(text);
  const reloc =
    /^\s+([0-9a-f]+): (R_X86_64_\w+)\s+(\w+)([+-]0x[0-9a-f]+)?/m.exec(text);
  if (!call || !reloc) throw new Error('Expected a call with a relocation');
  return {
    at: parseInt(call[1]!, 16),
    bytes: bytesOf(call[2]!),
    relocation: {
      offset: parseInt(reloc[1]!, 16),
      type: reloc[2]!,
      symbol: reloc[3]!,
      addend: reloc[4]
        ? (reloc[4].startsWith('-') ? -1 : 1) * parseInt(reloc[4].slice(3), 16)
        : 0,
    },
  };
}

export interface LinkedCall {
  symbols: Record<string, number>;
  at: number;
  bytes: number[];
  target: number;
}

/** Symbol addresses and the call in the linked executable's disassembly. */
export function parseLinked(text: string, caller: string): LinkedCall {
  const symbols: Record<string, number> = {};
  for (const m of text.matchAll(/^([0-9a-f]{16}) T (\w+)$/gm))
    symbols[m[2]!] = parseInt(m[1]!, 16);
  const block = text.slice(text.indexOf(`<${caller}>:`));
  const call =
    /^\s*([0-9a-f]+):\s+((?:[0-9a-f]{2} )+)\s*\tcall\s+([0-9a-f]+)/m.exec(
      block,
    );
  if (!call) throw new Error(`No call in ${caller}`);
  return {
    symbols,
    at: parseInt(call[1]!, 16),
    bytes: bytesOf(call[2]!),
    target: parseInt(call[3]!, 16),
  };
}

/** S + A − P as the four little-endian bytes of a signed 32-bit value. */
export function pc32(symbol: number, addend: number, place: number): number[] {
  for (const n of [symbol, addend, place])
    if (!Number.isSafeInteger(n)) throw new RangeError('Expected integers.');
  const value = symbol + addend - place;
  if (value < -(2 ** 31) || value >= 2 ** 31)
    throw new RangeError(
      'The target is out of reach of a 32-bit displacement.',
    );
  const view = new DataView(new ArrayBuffer(4));
  view.setInt32(0, value, true);
  return [...new Uint8Array(view.buffer)];
}
