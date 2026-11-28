import { expect, it } from 'vitest';
import type { Instruction } from './pipeline';
// solve(instructions, forwarding) returns how many bubbles the teaching
// pipeline inserts into straight-line code (no branches): the total number of
// cycles instructions wait for operands. An empty program has none. An
// unknown instruction kind, such as mul, is refused with a RangeError.
const op = (
  kind: Instruction['kind'],
  dest: string | undefined,
  ...sources: string[]
): Instruction => ({
  text: `${kind} ${dest ?? ''}`,
  kind,
  ...(dest ? { dest } : {}),
  sources,
});
export function contracts(
  solve: (instructions: Instruction[], forwarding: boolean) => number,
) {
  const loadChain = [
    op('alu', 'r1', 'r9'),
    op('load', 'r2', 'r1'),
    op('alu', 'r3', 'r2'),
  ];
  const aluChain = [
    op('alu', 'r1', 'r9'),
    op('alu', 'r2', 'r1'),
    op('alu', 'r3', 'r2'),
  ];
  const filled = [
    op('load', 'r1', 'r2'),
    op('alu', 'r7', 'r8'),
    op('alu', 'r3', 'r1'),
  ];
  const store = [op('load', 'r1', 'r2'), op('store', undefined, 'r1', 'r2')];
  it('unseen case 1', () => expect(solve(loadChain, true)).toBe(1));
  it('unseen case 2', () => expect(solve(loadChain, false)).toBe(4));
  it('unseen case 3', () => expect(solve(aluChain, true)).toBe(0));
  it('unseen case 4', () => expect(solve(aluChain, false)).toBe(4));
  it('unseen case 5', () => expect(solve(filled, true)).toBe(0));
  it('unseen case 6', () => expect(solve(filled, false)).toBe(1));
  it('unseen case 7', () => expect(solve(store, true)).toBe(1));
  it('unseen case 8', () => expect(solve([], true)).toBe(0));
  it('unseen case 9', () =>
    expect(() =>
      solve([op('mul' as Instruction['kind'], 'r1', 'r2')], true),
    ).toThrow(RangeError));
}
