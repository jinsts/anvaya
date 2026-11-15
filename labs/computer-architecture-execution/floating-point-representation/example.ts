// IEEE 754 binary32 as fields and exact values. JavaScript numbers are
// binary64, which holds every binary32 value exactly. `Math.fround` rounds a
// binary64 value to the nearest binary32 value, ties to even. Adding two
// binary32 values in binary64 and rounding once with `Math.fround` gives the
// correctly rounded binary32 sum, because binary64's 53 significand bits
// exceed 2 × 24 + 2.

export type Float32Kind = 'zero' | 'subnormal' | 'normal' | 'infinity' | 'nan';

export interface Float32Fields {
  /** The unsigned 32-bit pattern. */
  bits: number;
  sign: 0 | 1;
  /** Stored exponent field, 0–255. */
  exponent: number;
  /** Stored fraction field, 0 to 2²³ − 1. */
  fraction: number;
  kind: Float32Kind;
  /** Exponent after removing the bias, for normal and subnormal values. */
  scale: number | null;
  /** The stored value; binary64 represents it exactly. */
  value: number;
}

export const BIAS = 127;
export const FRACTION_BITS = 23;

function checkBits(bits: number): void {
  if (!Number.isInteger(bits) || bits < 0 || bits > 0xffffffff)
    throw new RangeError('Expected an unsigned 32-bit pattern.');
}

/** The binary32 pattern of the nearest binary32 value to `value`. */
export function bitsOf(value: number): number {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  return view.getUint32(0);
}

export function fromBits(bits: number): number {
  checkBits(bits);
  const view = new DataView(new ArrayBuffer(4));
  view.setUint32(0, bits);
  return view.getFloat32(0);
}

export function decode(bits: number): Float32Fields {
  checkBits(bits);
  const sign = (bits >>> 31) as 0 | 1;
  const exponent = (bits >>> FRACTION_BITS) & 0xff;
  const fraction = bits & 0x7fffff;
  let kind: Float32Kind;
  if (exponent === 0xff) kind = fraction === 0 ? 'infinity' : 'nan';
  else if (exponent === 0) kind = fraction === 0 ? 'zero' : 'subnormal';
  else kind = 'normal';
  const scale =
    kind === 'normal'
      ? exponent - BIAS
      : kind === 'subnormal' || kind === 'zero'
        ? 1 - BIAS
        : null;
  return { bits, sign, exponent, fraction, kind, scale, value: fromBits(bits) };
}

export function toggleBit(bits: number, position: number): number {
  checkBits(bits);
  if (!Number.isInteger(position) || position < 0 || position > 31)
    throw new RangeError('Expected a bit position from 0 through 31.');
  return (bits ^ (2 ** position)) >>> 0;
}

/** Exact decimal digits of integer × 2^power, using BigInt arithmetic. */
function exactFromParts(negative: boolean, integer: bigint, power: number) {
  let digits: string;
  if (power >= 0) digits = (integer << BigInt(power)).toString();
  else {
    const places = -power;
    const scaled = (integer * 5n ** BigInt(places))
      .toString()
      .padStart(places + 1, '0');
    const whole = scaled.slice(0, scaled.length - places);
    const part = scaled.slice(scaled.length - places).replace(/0+$/, '');
    digits = part ? `${whole}.${part}` : whole;
  }
  return (negative ? '-' : '') + digits;
}

/** The exact decimal value a binary32 pattern stores. */
export function exactDecimal(bits: number): string {
  const { sign, exponent, fraction, kind } = decode(bits);
  if (kind === 'nan') return 'NaN';
  if (kind === 'infinity') return sign ? '-Infinity' : 'Infinity';
  const integer = BigInt(kind === 'normal' ? fraction + 2 ** 23 : fraction);
  const power =
    (kind === 'normal' ? exponent - BIAS : 1 - BIAS) - FRACTION_BITS;
  return exactFromParts(sign === 1, integer, power);
}

/** The exact decimal value of a binary64 number, for comparison. */
export function exactDecimal64(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const raw = view.getBigUint64(0);
  const negative = raw >> 63n === 1n;
  const exponent = Number((raw >> 52n) & 0x7ffn);
  const fraction = raw & 0xfffffffffffffn;
  const integer = exponent === 0 ? fraction : fraction + (1n << 52n);
  const power = (exponent === 0 ? 1 : exponent) - 1023 - 52;
  return exactFromParts(negative, integer, power);
}

/** The pattern of the next binary32 value toward +∞. */
export function nextUp(bits: number): number {
  const { sign, kind } = decode(bits);
  if (kind === 'nan' || (kind === 'infinity' && sign === 0)) return bits;
  if (kind === 'zero') return 1;
  return sign === 0 ? bits + 1 : bits - 1;
}

/** The pattern of the next binary32 value toward −∞. */
export function nextDown(bits: number): number {
  const { sign, kind } = decode(bits);
  if (kind === 'nan' || (kind === 'infinity' && sign === 1)) return bits;
  if (kind === 'zero') return 0x80000001;
  return sign === 0 ? bits - 1 : bits + 1;
}

/** Gap from a finite binary32 magnitude to the next larger binary32 value. */
export function spacing(value: number): number {
  const bits = bitsOf(Math.abs(value));
  const { kind } = decode(bits);
  const next = fromBits(nextUp(bits));
  if (kind === 'nan' || kind === 'infinity' || !Number.isFinite(next))
    throw new RangeError('Spacing needs a finite value below the largest.');
  return next - fromBits(bits);
}

export interface SumStep {
  add: number;
  /** total + add in binary64: exact for the lesson's small integers. */
  wide: number;
  /** The binary32 total kept after rounding. */
  stored: number;
}

function checkFloat32(values: readonly number[]): void {
  for (const value of values)
    if (Math.fround(value) !== value && !Number.isNaN(value))
      throw new RangeError(`${value} is not a binary32 value.`);
}

/** Left-to-right binary32 summation, recording every rounding. */
export function sumFloat32(values: readonly number[]) {
  checkFloat32(values);
  let total = 0;
  const steps: SumStep[] = [];
  for (const add of values) {
    const wide = total + add;
    total = Math.fround(wide);
    steps.push({ add, wide, stored: total });
  }
  return { total, steps };
}

/** Kahan's compensated summation, with every operation rounded to binary32. */
export function kahanFloat32(values: readonly number[]): number {
  checkFloat32(values);
  const f = Math.fround;
  let total = 0;
  let compensation = 0;
  for (const value of values) {
    const adjusted = f(value - compensation);
    const next = f(total + adjusted);
    compensation = f(f(next - total) - adjusted);
    total = next;
  }
  return total;
}

/** Positive values of one binade in a toy format with the same rules. */
export function toyBinade(fractionBits: number, power: number): number[] {
  if (!Number.isInteger(fractionBits) || fractionBits < 1 || fractionBits > 6)
    throw new RangeError('Use 1 to 6 fraction bits for a readable figure.');
  if (!Number.isInteger(power) || Math.abs(power) > 8)
    throw new RangeError('Use a small integer power of two.');
  const count = 2 ** fractionBits;
  return Array.from(
    { length: count },
    (_, fraction) => (1 + fraction / count) * 2 ** power,
  );
}

export function floatExample(): string {
  const tenth = bitsOf(0.1);
  const ones = [2 ** 24, 1, 1, 1, 1];
  return [
    `0.1 as binary32: ${tenth.toString(16).padStart(8, '0')} = ${exactDecimal(tenth)}`,
    `next after 16777216: ${fromBits(nextUp(bitsOf(2 ** 24)))}`,
    `16777217 is stored as ${Math.fround(16777217)}`,
    `large first: ${sumFloat32(ones).total}`,
    `small first: ${sumFloat32([...ones.slice(1), ones[0]!]).total}`,
    `compensated: ${kahanFloat32(ones)}`,
    `(0.1 + 0.2) + 0.3 = ${0.1 + 0.2 + 0.3}; 0.1 + (0.2 + 0.3) = ${0.1 + (0.2 + 0.3)}`,
  ].join('\n');
}
