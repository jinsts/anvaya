// A teaching register machine with separate instruction and data memory. Each
// step reports the new architectural state and which datapath units and wires
// the instruction uses, so a figure can highlight them. It is not a real ISA.

export type DatapathInstruction =
  | { op: 'load'; register: number; address: number }
  | { op: 'addi'; register: number; value: number }
  | { op: 'store'; register: number; address: number };

export interface MachineState {
  pc: number;
  registers: readonly number[];
  memory: Readonly<Record<number, number>>;
}

export const UNITS = [
  'pc',
  'next-pc',
  'instruction-memory',
  'decoder',
  'registers',
  'alu',
  'data-memory',
] as const;
export type Unit = (typeof UNITS)[number];

export const WIRES = [
  'pc-to-imem',
  'pc-to-next',
  'next-to-pc',
  'imem-to-decoder',
  'decoder-to-registers',
  'decoder-to-alu',
  'registers-to-alu',
  'alu-to-registers',
  'alu-to-dmem',
  'registers-to-dmem',
  'dmem-to-registers',
] as const;
export type Wire = (typeof WIRES)[number];

export interface DatapathStep {
  instruction: DatapathInstruction;
  before: MachineState;
  after: MachineState;
  units: Unit[];
  wires: Wire[];
  /** The state other than the PC that the instruction changed. */
  changed: 'register' | 'memory';
}

const REGISTERS = 4;
// Every instruction is fetched, decoded and moves the PC to the next one.
const FETCH: { units: Unit[]; wires: Wire[] } = {
  units: ['pc', 'next-pc', 'instruction-memory', 'decoder'],
  wires: ['pc-to-imem', 'pc-to-next', 'next-to-pc', 'imem-to-decoder'],
};

function checkWord(value: number, what: string): void {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
    throw new RangeError(`${what} must be an unsigned 32-bit value.`);
}

export function stepDatapath(
  state: MachineState,
  instruction: DatapathInstruction,
): DatapathStep {
  if (
    !Number.isInteger(instruction.register) ||
    instruction.register < 0 ||
    instruction.register >= REGISTERS
  )
    throw new RangeError(`Registers are R0 to R${REGISTERS - 1}.`);
  const registers = [...state.registers];
  const memory = { ...state.memory };
  const r = instruction.register;
  let units: Unit[];
  let wires: Wire[];
  let changed: DatapathStep['changed'];
  if (instruction.op === 'load') {
    checkWord(instruction.address, 'An address');
    const value = memory[instruction.address];
    if (value === undefined)
      throw new RangeError(`Address ${instruction.address} holds no data.`);
    registers[r] = value;
    // The ALU passes the address from the instruction to data memory.
    units = ['registers', 'alu', 'data-memory'];
    wires = [
      'decoder-to-registers',
      'decoder-to-alu',
      'alu-to-dmem',
      'dmem-to-registers',
    ];
    changed = 'register';
  } else if (instruction.op === 'addi') {
    checkWord(instruction.value, 'An immediate');
    registers[r] = (registers[r]! + instruction.value) % 2 ** 32;
    units = ['registers', 'alu'];
    wires = [
      'decoder-to-registers',
      'decoder-to-alu',
      'registers-to-alu',
      'alu-to-registers',
    ];
    changed = 'register';
  } else {
    checkWord(instruction.address, 'An address');
    memory[instruction.address] = registers[r]!;
    units = ['registers', 'alu', 'data-memory'];
    wires = [
      'decoder-to-registers',
      'decoder-to-alu',
      'alu-to-dmem',
      'registers-to-dmem',
    ];
    changed = 'memory';
  }
  return {
    instruction,
    before: state,
    after: { pc: state.pc + 1, registers, memory },
    units: [...FETCH.units, ...units],
    wires: [...FETCH.wires, ...wires],
    changed,
  };
}

export function runDatapath(
  program: readonly DatapathInstruction[],
  initial: MachineState,
): DatapathStep[] {
  const steps: DatapathStep[] = [];
  let state = initial;
  for (const instruction of program) {
    const step = stepDatapath(state, instruction);
    steps.push(step);
    state = step.after;
  }
  return steps;
}

/** The lesson's program: the same load, add and store as the native `bump`. */
export const BUMP: DatapathInstruction[] = [
  { op: 'load', register: 0, address: 1000 },
  { op: 'addi', register: 0, value: 1 },
  { op: 'store', register: 0, address: 1000 },
];
export const BUMP_START: MachineState = {
  pc: 0,
  registers: [0, 0, 0, 0],
  memory: { 1000: 7 },
};

export function assembly(instruction: DatapathInstruction): string {
  if (instruction.op === 'load')
    return `load R${instruction.register}, [${instruction.address}]`;
  if (instruction.op === 'addi')
    return `add R${instruction.register}, R${instruction.register}, ${instruction.value}`;
  return `store R${instruction.register}, [${instruction.address}]`;
}

export function datapathExample(): string {
  return runDatapath(BUMP, BUMP_START)
    .map(
      (s) =>
        `${assembly(s.instruction)}: PC ${s.after.pc}, R0 ${s.after.registers[0]}, memory[1000] ${s.after.memory[1000]}`,
    )
    .join('\n');
}
