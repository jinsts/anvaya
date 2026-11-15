import { expect, it } from 'vitest';
import {
  BUMP,
  BUMP_START,
  UNITS,
  WIRES,
  assembly,
  datapathExample,
  runDatapath,
  stepDatapath,
} from './datapath';

it('loads 7, adds 1 in a register and stores 8 back', () => {
  const steps = runDatapath(BUMP, BUMP_START);
  expect(
    steps.map((s) => [s.after.pc, s.after.registers[0], s.after.memory[1000]]),
  ).toEqual([
    [1, 7, 7],
    [2, 8, 7],
    [3, 8, 8],
  ]);
  expect(steps.map((s) => s.changed)).toEqual([
    'register',
    'register',
    'memory',
  ]);
  // Inputs are not mutated.
  expect(BUMP_START.memory[1000]).toBe(7);
  expect(BUMP_START.registers[0]).toBe(0);
});

it('uses data memory only for loads and stores, with the right direction', () => {
  const [load, add, store] = runDatapath(BUMP, BUMP_START);
  for (const step of [load!, add!, store!]) {
    expect(step.wires).toEqual(
      expect.arrayContaining(['pc-to-imem', 'imem-to-decoder', 'next-to-pc']),
    );
    expect(new Set(step.wires).size).toBe(step.wires.length);
    for (const unit of step.units) expect(UNITS).toContain(unit);
    for (const wire of step.wires) expect(WIRES).toContain(wire);
  }
  expect(load!.wires).toContain('dmem-to-registers');
  expect(load!.wires).not.toContain('registers-to-dmem');
  expect(store!.wires).toContain('registers-to-dmem');
  expect(store!.wires).not.toContain('dmem-to-registers');
  expect(add!.units).not.toContain('data-memory');
  expect(add!.wires).toEqual(
    expect.arrayContaining(['registers-to-alu', 'alu-to-registers']),
  );
});

it('wraps register addition at 32 bits and rejects invalid instructions', () => {
  const full = { pc: 0, registers: [0xffffffff, 0, 0, 0], memory: {} };
  expect(
    stepDatapath(full, { op: 'addi', register: 0, value: 1 }).after
      .registers[0],
  ).toBe(0);
  expect(() =>
    stepDatapath(full, { op: 'load', register: 0, address: 4 }),
  ).toThrow(RangeError);
  expect(() =>
    stepDatapath(full, { op: 'addi', register: 4, value: 1 }),
  ).toThrow(RangeError);
  expect(() =>
    stepDatapath(full, { op: 'store', register: 0, address: -1 }),
  ).toThrow(RangeError);
});

it('prints the lesson output', () => {
  expect(BUMP.map(assembly)).toEqual([
    'load R0, [1000]',
    'add R0, R0, 1',
    'store R0, [1000]',
  ]);
  expect(datapathExample()).toBe(
    'load R0, [1000]: PC 1, R0 7, memory[1000] 7\n' +
      'add R0, R0, 1: PC 2, R0 8, memory[1000] 7\n' +
      'store R0, [1000]: PC 3, R0 8, memory[1000] 8',
  );
});
