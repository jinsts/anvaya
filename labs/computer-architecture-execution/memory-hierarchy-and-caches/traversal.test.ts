import { expect, it } from 'vitest';
import { linesTouched, traversal } from './traversal';

it('touches each line once per row walk and once per element in a column walk', () => {
  const rows = traversal(4, 8, 4, 16, 'rows');
  const columns = traversal(4, 8, 4, 16, 'columns');
  expect(
    rows.slice(0, 5).map((v) => [v.row, v.column, v.address, v.line]),
  ).toEqual([
    [0, 0, 0, 0],
    [0, 1, 4, 0],
    [0, 2, 8, 0],
    [0, 3, 12, 0],
    [0, 4, 16, 1],
  ]);
  expect(
    columns.slice(0, 5).map((v) => [v.row, v.column, v.address, v.line]),
  ).toEqual([
    [0, 0, 0, 0],
    [1, 0, 32, 2],
    [2, 0, 64, 4],
    [3, 0, 96, 6],
    [0, 1, 4, 0],
  ]);
  // The first 8 reads: rows use 2 lines, columns 8 different elements from 4 lines.
  expect(linesTouched(rows, 8)).toBe(2);
  expect(linesTouched(columns, 8)).toBe(4);
  // Over the whole walk both touch all 8 lines once for the first time.
  expect(rows.filter((v) => v.firstTouch)).toHaveLength(8);
  expect(columns.filter((v) => v.firstTouch)).toHaveLength(8);
  expect(() => traversal(0, 8, 4, 16, 'rows')).toThrow(RangeError);
});

it('gives the practice answer for the first row and column of a 4×4 matrix', () => {
  const rows = traversal(4, 4, 4, 16, 'rows');
  const columns = traversal(4, 4, 4, 16, 'columns');
  expect(rows.slice(0, 4).map((v) => v.address)).toEqual([0, 4, 8, 12]);
  expect(columns.slice(0, 4).map((v) => v.address)).toEqual([0, 16, 32, 48]);
  expect(linesTouched(rows, 4)).toBe(1);
  expect(linesTouched(columns, 4)).toBe(4);
});
