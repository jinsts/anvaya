import { expect, it } from 'vitest';
import { PROGRAMS, pipelineExample, schedule, type Cell } from './pipeline';

const program = (id: string) => PROGRAMS.find((p) => p.id === id)!.program;
const table = (id: string, forwarding: boolean) =>
  schedule(program(id), { forwarding }).rows.map((r) =>
    r.cells.map((c) => (c === null ? '.' : c === 'stall' ? '-' : c)).join(' '),
  );

it('stalls a load-use pair for two cycles without forwarding and one with it', () => {
  expect(table('load-use', false)).toEqual([
    'IF ID EX MEM WB . . . . . . .',
    '. IF ID - - EX MEM WB . . . .',
    '. . IF - - ID - - EX MEM WB .',
    '. . . . . IF - - ID EX MEM WB',
  ]);
  expect(table('load-use', true)).toEqual([
    'IF ID EX MEM WB . . . .',
    '. IF ID - EX MEM WB . .',
    '. . IF - ID EX MEM WB .',
    '. . . . IF ID EX MEM WB',
  ]);
  const forwarded = schedule(program('load-use'), { forwarding: true });
  expect(forwarded.rows[1]!.waitedFor).toEqual({
    register: 'r1',
    producer: 'ld r1, 0(r2)',
    via: 'forwarding',
  });
  // ALU to ALU forwarding needs no bubble.
  expect(forwarded.rows[2]!.stalls).toBe(0);
});

it('hides the load-use bubble when an independent instruction fills it', () => {
  expect(schedule(program('reordered'), { forwarding: true })).toMatchObject({
    cycles: 8,
    bubbles: 0,
  });
});

it('flushes the two instructions fetched behind a taken branch', () => {
  expect(table('branch', true)).toEqual([
    'IF ID EX MEM WB . . . .',
    '. IF ID EX MEM WB . . .',
    '. . IF ID flushed . . . .',
    '. . . IF flushed . . . .',
    '. . . . IF ID EX MEM WB',
  ]);
  // Without forwarding the branch waits for r1, and fetch waits behind it.
  expect(table('branch', false)).toEqual([
    'IF ID EX MEM WB . . . . . .',
    '. IF ID - - EX MEM WB . . .',
    '. . IF - - ID flushed . . . .',
    '. . . . . IF flushed . . . .',
    '. . . . . . IF ID EX MEM WB',
  ]);
});

it('never puts two instructions in one stage in the same cycle', () => {
  for (const { program: p } of PROGRAMS)
    for (const forwarding of [false, true]) {
      const { rows, cycles } = schedule(p, { forwarding });
      for (let c = 0; c < cycles; c++) {
        const busy = rows
          .map((r) => r.cells[c])
          .filter(
            (cell): cell is Cell =>
              cell !== null && cell !== 'stall' && cell !== 'flushed',
          );
        expect(new Set(busy).size).toBe(busy.length);
      }
      for (const row of rows.filter((r) => !r.flushed))
        expect(row.cells.filter((x) => x && x !== 'stall')).toEqual([
          'IF',
          'ID',
          'EX',
          'MEM',
          'WB',
        ]);
    }
});

it('rejects empty programs, unknown kinds and branches without a target', () => {
  expect(() => schedule([], { forwarding: true })).toThrow(RangeError);
  expect(() =>
    schedule([{ text: 'mul', kind: 'mul' as never, sources: [] }], {
      forwarding: true,
    }),
  ).toThrow(RangeError);
  expect(() =>
    schedule([{ text: 'b', kind: 'branch', sources: [], taken: true }], {
      forwarding: true,
    }),
  ).toThrow(RangeError);
});

it('prints the lesson output', () => {
  expect(pipelineExample()).toBe(
    [
      'load-use, forwarding off: 12 cycles, 4 bubbles, 0 flushed',
      'load-use, forwarding on: 9 cycles, 1 bubbles, 0 flushed',
      'reordered, forwarding off: 11 cycles, 3 bubbles, 0 flushed',
      'reordered, forwarding on: 8 cycles, 0 bubbles, 0 flushed',
      'branch, forwarding off: 11 cycles, 2 bubbles, 2 flushed',
      'branch, forwarding on: 9 cycles, 0 bubbles, 2 flushed',
    ].join('\n'),
  );
});
