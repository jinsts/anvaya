// An explicit byte model; these are not JavaScript's ordinary number rules.
function byte(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError('Expected an unsigned byte.');
  }
}

export function signedByte(raw: number): number {
  byte(raw);
  return raw < 128 ? raw : raw - 256;
}

export function addBytes(left: number, right: number) {
  byte(left);
  byte(right);
  const unsigned = (left + right) % 256;
  const signedSum = signedByte(left) + signedByte(right);
  return {
    unsigned,
    signed: signedByte(unsigned),
    carry: left + right > 255,
    signedOverflow: signedSum < -128 || signedSum > 127,
  };
}

export function wordBytes(value: number, littleEndian: boolean): number[] {
  if (!Number.isInteger(value) || value < 0 || value > 65535) {
    throw new RangeError('Expected an unsigned 16-bit word.');
  }
  const bytes = [Math.floor(value / 256), value % 256];
  return littleEndian ? bytes.reverse() : bytes;
}

export function bitAt(raw: number, position: number): number {
  byte(raw);
  if (!Number.isInteger(position) || position < 0 || position > 7) {
    throw new RangeError('Expected a bit position from 0 through 7.');
  }
  return (raw >>> position) & 1;
}

// Field alignments are explicit inputs, not JavaScript object-layout rules.
export function layoutRecord(
  fields: readonly { bytes: number; alignment: number }[],
) {
  let end = 0;
  let payload = 0;
  let recordAlignment = 1;
  const offsets: number[] = [];
  for (const { bytes, alignment } of fields) {
    if (
      !Number.isSafeInteger(bytes) ||
      bytes <= 0 ||
      !Number.isSafeInteger(alignment) ||
      alignment <= 0 ||
      !Number.isInteger(Math.log2(alignment))
    ) {
      throw new RangeError(
        'Expected positive sizes and power-of-two alignments.',
      );
    }
    const offset = Math.ceil(end / alignment) * alignment;
    end = offset + bytes;
    payload += bytes;
    if (!Number.isSafeInteger(end) || !Number.isSafeInteger(payload)) {
      throw new RangeError('Record exceeds the model address range.');
    }
    offsets.push(offset);
    recordAlignment = Math.max(recordAlignment, alignment);
  }
  const size = Math.ceil(end / recordAlignment) * recordAlignment;
  if (!Number.isSafeInteger(size)) throw new RangeError('Record is too large.');
  return { offsets, size, paddingBytes: size - payload };
}

export function representationExample(): string {
  return [
    `255 as signed byte: ${signedByte(255)}`,
    `127 + 1: ${JSON.stringify(addBytes(127, 1))}`,
    `0x1234 little-endian: ${wordBytes(0x1234, true).join(', ')}`,
    `0.1 + 0.2: ${0.1 + 0.2}`,
    `record: ${JSON.stringify(
      layoutRecord([
        { bytes: 1, alignment: 1 },
        { bytes: 4, alignment: 4 },
        { bytes: 1, alignment: 1 },
      ]),
    )}`,
  ].join('\n');
}
