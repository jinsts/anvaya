// An illustrative 8-bit accumulator machine, not an actual processor ISA.
export type Instruction =
  | { op: 'set' | 'add'; value: number }
  | { op: 'jnz'; target: number }
  | { op: 'halt' };

export interface Snapshot {
  pc: number;
  accumulator: number;
  halted: boolean;
}

export function execute(
  program: readonly Instruction[],
  maxSteps = 100,
): Snapshot[] {
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError('maxSteps must be a positive safe integer');
  }
  if (program.length === 0) throw new RangeError('Program is empty');
  for (const instruction of program) {
    if (
      (instruction.op === 'set' || instruction.op === 'add') &&
      (!Number.isInteger(instruction.value) ||
        instruction.value < 0 ||
        instruction.value > 255)
    ) {
      throw new RangeError('Operands must be unsigned bytes');
    }
    if (
      instruction.op === 'jnz' &&
      (!Number.isInteger(instruction.target) ||
        instruction.target < 0 ||
        instruction.target >= program.length)
    ) {
      throw new RangeError('Branch target is outside the program');
    }
  }

  let pc = 0;
  let accumulator = 0;
  const trace: Snapshot[] = [{ pc, accumulator, halted: false }];
  for (let steps = 0; steps < maxSteps; steps += 1) {
    const instruction = program[pc];
    if (!instruction)
      throw new RangeError('Execution fell outside the program');
    let nextPC = pc + 1;
    if (instruction.op === 'set') accumulator = instruction.value;
    if (instruction.op === 'add') {
      accumulator = (accumulator + instruction.value) % 256;
    }
    if (instruction.op === 'jnz' && accumulator !== 0) {
      nextPC = instruction.target;
    }
    const halted = instruction.op === 'halt';
    if (!halted) pc = nextPC;
    trace.push({ pc, accumulator, halted });
    if (halted) return trace;
  }
  throw new RangeError('Step limit reached before halt');
}

export function executionExample(): string {
  const trace = execute([
    { op: 'set', value: 2 },
    { op: 'add', value: 255 },
    { op: 'jnz', target: 1 },
    { op: 'halt' },
  ]);
  return trace
    .map(
      ({ pc, accumulator, halted }) =>
        `${pc}: ${accumulator}${halted ? ' halted' : ''}`,
    )
    .join('\n');
}
