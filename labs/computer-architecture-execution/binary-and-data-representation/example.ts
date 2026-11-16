// An explicit fixed-width integer model; these are not JavaScript's ordinary
// number rules. Widths are small so every pattern can be checked and drawn.

function checkWidth(width: number): void {
  if (!Number.isInteger(width) || width < 1 || width > 16)
    throw new RangeError('Expected a width from 1 to 16 bits.');
}
function checkPattern(raw: number, width: number): void {
  checkWidth(width);
  if (!Number.isInteger(raw) || raw < 0 || raw >= 2 ** width)
    throw new RangeError(`Expected an unsigned ${width}-bit pattern.`);
}

/** The two's complement value of a pattern: the top bit weighs −2^(w−1). */
export function signedValue(raw: number, width: number): number {
  checkPattern(raw, width);
  return raw < 2 ** (width - 1) ? raw : raw - 2 ** width;
}

export function signedByte(raw: number): number {
  return signedValue(raw, 8);
}

/** Add two patterns, keep the low w bits, and report both conditions. */
export function addPatterns(left: number, right: number, width: number) {
  checkPattern(left, width);
  checkPattern(right, width);
  const unsigned = (left + right) % 2 ** width;
  const signedSum = signedValue(left, width) + signedValue(right, width);
  const half = 2 ** (width - 1);
  return {
    unsigned,
    signed: signedValue(unsigned, width),
    carry: left + right >= 2 ** width,
    signedOverflow: signedSum < -half || signedSum >= half,
  };
}

export function addBytes(left: number, right: number) {
  return addPatterns(left, right, 8);
}

export function bitAt(raw: number, position: number): number {
  checkPattern(raw, 8);
  if (!Number.isInteger(position) || position < 0 || position > 7)
    throw new RangeError('Expected a bit position from 0 through 7.');
  return (raw >>> position) & 1;
}

/** Widen a byte to 16 bits by copying its sign bit or by adding zeros. */
export function extendByte(raw: number, kind: 'sign' | 'zero'): number {
  checkPattern(raw, 8);
  return kind === 'zero' || raw < 128 ? raw : raw | 0xff00;
}

/** Shift a byte right by n, filling with zeros or with copies of bit 7. */
export function shiftRightByte(
  raw: number,
  by: number,
  kind: 'logical' | 'arithmetic',
): number {
  checkPattern(raw, 8);
  if (!Number.isInteger(by) || by < 0 || by > 7)
    throw new RangeError('Expected a shift from 0 through 7.');
  const shifted = raw >>> by;
  if (kind === 'logical' || raw < 128) return shifted;
  return shifted | ((0xff << (8 - by)) & 0xff);
}

/** Every w-bit pattern with its unsigned and signed values, for the wheel. */
export function wheel(width: number) {
  checkWidth(width);
  return Array.from({ length: 2 ** width }, (_, raw) => ({
    raw,
    bits: raw.toString(2).padStart(width, '0'),
    unsigned: raw,
    signed: signedValue(raw, width),
  }));
}

export function representationExample(): string {
  return [
    `255 as signed byte: ${signedByte(255)}`,
    `127 + 1: ${JSON.stringify(addBytes(127, 1))}`,
    `255 + 1: ${JSON.stringify(addBytes(255, 1))}`,
    `0xf0 sign-extended: 0x${extendByte(0xf0, 'sign').toString(16)}; zero-extended: 0x${extendByte(0xf0, 'zero').toString(16).padStart(4, '0')}`,
    `0x96 >> 2: logical 0x${shiftRightByte(0x96, 2, 'logical').toString(16)}, arithmetic 0x${shiftRightByte(0x96, 2, 'arithmetic').toString(16)}`,
  ].join('\n');
}
