// Which cache lines a row-major matrix walk touches, in rows or in columns.
// Element (r, c) of a row-major matrix lives at (r × columns + c) × size.

export interface Visit {
  row: number;
  column: number;
  address: number;
  line: number;
  /** The first access to this line in the walk. */
  firstTouch: boolean;
}

export function traversal(
  rows: number,
  columns: number,
  elementBytes: number,
  lineBytes: number,
  order: 'rows' | 'columns',
): Visit[] {
  for (const n of [rows, columns, elementBytes, lineBytes])
    if (!Number.isSafeInteger(n) || n <= 0)
      throw new RangeError('Expected positive whole numbers.');
  const seen = new Set<number>();
  const visits: Visit[] = [];
  const outer = order === 'rows' ? rows : columns;
  const inner = order === 'rows' ? columns : rows;
  for (let a = 0; a < outer; a++)
    for (let b = 0; b < inner; b++) {
      const [row, column] = order === 'rows' ? [a, b] : [b, a];
      const address = (row * columns + column) * elementBytes;
      const line = Math.floor(address / lineBytes);
      visits.push({ row, column, address, line, firstTouch: !seen.has(line) });
      seen.add(line);
    }
  return visits;
}

/** Distinct lines among the first n visits. */
export function linesTouched(visits: readonly Visit[], n: number): number {
  return new Set(visits.slice(0, n).map((v) => v.line)).size;
}
