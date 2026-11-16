// Multi-byte data as explicit rules: UTF-8 and UTF-16 encodings of code
// points, the four ways to count a string, byte order, and record layout
// under stated alignments. The tests compare each rule with the platform
// (TextEncoder, String) and with output recorded from a native x86-64 program.

const MAX_CODE_POINT = 0x10ffff;

function checkScalar(codePoint: number): void {
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > MAX_CODE_POINT
  )
    throw new RangeError('Expected a code point from U+0000 to U+10FFFF.');
  if (codePoint >= 0xd800 && codePoint <= 0xdfff)
    throw new RangeError('Surrogates U+D800–U+DFFF are not encoded alone.');
}

/** RFC 3629's table: each row's range and its byte templates. */
export const UTF8_ROWS = [
  { first: 0x0000, last: 0x007f, templates: ['0xxxxxxx'] },
  { first: 0x0080, last: 0x07ff, templates: ['110xxxxx', '10xxxxxx'] },
  {
    first: 0x0800,
    last: 0xffff,
    templates: ['1110xxxx', '10xxxxxx', '10xxxxxx'],
  },
  {
    first: 0x10000,
    last: MAX_CODE_POINT,
    templates: ['11110xxx', '10xxxxxx', '10xxxxxx', '10xxxxxx'],
  },
] as const;

export interface Utf8Byte {
  value: number;
  /** Fixed marker bits from the template. */
  prefix: string;
  /** Bits copied from the code point, high bits first. */
  payload: string;
}

/** Encode one code point into UTF-8, keeping each byte's marker and payload. */
export function utf8Bytes(codePoint: number): Utf8Byte[] {
  checkScalar(codePoint);
  const row = UTF8_ROWS.find((r) => codePoint <= r.last)!;
  const widths = row.templates.map((t) => t.replaceAll(/[01]/g, '').length);
  const total = widths.reduce((a, b) => a + b, 0);
  let bits = codePoint.toString(2).padStart(total, '0');
  return row.templates.map((template, index) => {
    const prefix = template.replaceAll('x', '');
    const payload = bits.slice(0, widths[index]);
    bits = bits.slice(widths[index]);
    return { value: parseInt(prefix + payload, 2), prefix, payload };
  });
}

/** UTF-16 code units: one unit, or a surrogate pair above U+FFFF. */
export function utf16Units(codePoint: number): number[] {
  checkScalar(codePoint);
  if (codePoint <= 0xffff) return [codePoint];
  const offset = codePoint - 0x10000;
  return [0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff)];
}

export interface LadderPoint {
  codePoint: number;
  utf16: number[];
  utf8: number[];
}
export interface LadderGrapheme {
  text: string;
  points: LadderPoint[];
}

/** A string as graphemes, each holding code points with both encodings. */
export function textLadder(text: string): LadderGrapheme[] {
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return [...segmenter.segment(text)].map(({ segment }) => ({
    text: segment,
    points: [...segment].map((character) => {
      const codePoint = character.codePointAt(0)!;
      return {
        codePoint,
        utf16: utf16Units(codePoint),
        utf8: utf8Bytes(codePoint).map((b) => b.value),
      };
    }),
  }));
}

export function textUnits(text: string) {
  const ladder = textLadder(text);
  const points = ladder.flatMap((g) => g.points);
  return {
    bytes: points.reduce((n, p) => n + p.utf8.length, 0),
    units: points.reduce((n, p) => n + p.utf16.length, 0),
    points: points.length,
    graphemes: ladder.length,
  };
}

/** The bytes of an unsigned integer in address order. */
export function bytesInOrder(
  value: number,
  width: 2 | 4,
  order: 'little' | 'big',
): number[] {
  if (!Number.isInteger(value) || value < 0 || value >= 2 ** (8 * width))
    throw new RangeError(`Expected an unsigned ${8 * width}-bit value.`);
  const view = new DataView(new ArrayBuffer(width));
  if (width === 2) view.setUint16(0, value, order === 'little');
  else view.setUint32(0, value, order === 'little');
  return [...new Uint8Array(view.buffer)];
}

export interface Field {
  name: string;
  size: number;
  alignment: number;
}
export interface Placed extends Field {
  offset: number;
}

/**
 * Place fields in order: each starts at the next multiple of its alignment,
 * and the record's size rounds up to its largest alignment so the next
 * array element is aligned too. Sizes and alignments are inputs; a real ABI
 * supplies them for each type.
 */
export function layoutRecord(fields: readonly Field[]) {
  const names = new Set<string>();
  let end = 0;
  let alignment = 1;
  const placed: Placed[] = [];
  const padding: { offset: number; size: number }[] = [];
  for (const field of fields) {
    if (
      !Number.isSafeInteger(field.size) ||
      field.size <= 0 ||
      !Number.isSafeInteger(field.alignment) ||
      field.alignment <= 0 ||
      (field.alignment & (field.alignment - 1)) !== 0
    )
      throw new RangeError(
        'Expected positive sizes and power-of-two alignments.',
      );
    if (names.has(field.name))
      throw new RangeError(`Duplicate field ${field.name}.`);
    names.add(field.name);
    const offset = Math.ceil(end / field.alignment) * field.alignment;
    if (offset > end) padding.push({ offset: end, size: offset - end });
    placed.push({ ...field, offset });
    end = offset + field.size;
    alignment = Math.max(alignment, field.alignment);
  }
  const size = Math.ceil(end / alignment) * alignment;
  if (size > end) padding.push({ offset: end, size: size - end });
  return {
    fields: placed,
    size,
    alignment,
    padding,
    paddingBytes: padding.reduce((n, p) => n + p.size, 0),
  };
}

/** The record used in the lesson, in its declared order (x86-64 C sizes). */
export const DECLARED: Field[] = [
  { name: 'tag', size: 1, alignment: 1 },
  { name: 'ratio', size: 8, alignment: 8 },
  { name: 'flag', size: 1, alignment: 1 },
  { name: 'count', size: 4, alignment: 4 },
];

/** Largest alignment first, keeping declared order among equals. */
export function byAlignment(fields: readonly Field[]): Field[] {
  return [...fields].sort((a, b) => b.alignment - a.alignment);
}

const hex = (bytes: number[]) =>
  bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');

export function layoutExample(): string {
  const text = 'A\u{1F642}é';
  const declared = layoutRecord(DECLARED);
  const reordered = layoutRecord(byAlignment(DECLARED));
  const offsets = (r: typeof declared) =>
    r.fields.map((f) => `${f.name}@${f.offset}`).join(' ');
  return [
    `U+20AC in UTF-8: ${hex(utf8Bytes(0x20ac).map((b) => b.value))}`,
    `counts: ${JSON.stringify(textUnits(text))}`,
    `0x12345678 little-endian: ${hex(bytesInOrder(0x12345678, 4, 'little'))}`,
    `0x12345678 big-endian: ${hex(bytesInOrder(0x12345678, 4, 'big'))}`,
    `declared: size ${declared.size}, padding ${declared.paddingBytes}, ${offsets(declared)}`,
    `reordered: size ${reordered.size}, padding ${reordered.paddingBytes}, ${offsets(reordered)}`,
  ].join('\n');
}
