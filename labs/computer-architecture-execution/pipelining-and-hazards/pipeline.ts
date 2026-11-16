// A classic five-stage, in-order teaching pipeline: IF (fetch), ID (decode
// and read registers), EX (execute), MEM (memory), WB (write back). One
// instruction enters per cycle. Assumptions, stated so the timeline can be
// checked:
// - Registers are written in the first half of WB and read in the second
//   half of ID, so without forwarding a consumer's last ID cycle may be the
//   producer's WB cycle.
// - With forwarding, an ALU result reaches the next instruction's EX in the
//   following cycle; a load's value is available only after MEM.
// - Branches are predicted not taken and resolved in EX. A taken branch
//   flushes the instructions fetched after it and fetch restarts at the
//   target in the next cycle.
// - Stores read their data register in EX, like any other source.

export type Stage = 'IF' | 'ID' | 'EX' | 'MEM' | 'WB';
export type Cell = Stage | 'stall' | 'flushed' | null;

export interface Instruction {
  text: string;
  kind: 'alu' | 'load' | 'store' | 'branch';
  dest?: string;
  sources: string[];
  /** For a branch: whether it is taken, and the index of its target. */
  taken?: boolean;
  target?: number;
}

export interface Row {
  instruction: Instruction;
  /** Index in the static program. */
  index: number;
  cells: Cell[];
  flushed: boolean;
  /** Cycles spent waiting in ID for an operand. */
  stalls: number;
  /** Why the instruction waited, if it did. */
  waitedFor?: {
    register: string;
    producer: string;
    via: 'register file' | 'forwarding';
  };
  ex?: number;
}

export interface Schedule {
  rows: Row[];
  cycles: number;
  completed: number;
  bubbles: number;
  flushed: number;
}

export function schedule(
  program: readonly Instruction[],
  { forwarding }: { forwarding: boolean },
  maxInstructions = 64,
): Schedule {
  if (program.length === 0) throw new RangeError('The program is empty.');
  const rows: Row[] = [];
  // Cycle numbers start at 1. f = enters IF, d = enters ID, e = EX cycle.
  let previous: { f: number; d: number; e: number } | null = null;
  let redirectAt: number | null = null;
  const writers = new Map<
    string,
    { e: number; kind: Instruction['kind']; text: string }
  >();
  let pc = 0;
  while (pc < program.length) {
    if (rows.length >= maxInstructions)
      throw new RangeError('Too many instructions.');
    const instruction = program[pc]!;
    const f: number =
      redirectAt ?? (previous ? Math.max(previous.f + 1, previous.d) : 1);
    redirectAt = null;
    const d: number = previous ? Math.max(f + 1, previous.e) : f + 1;
    let e: number = previous ? Math.max(d + 1, previous.e + 1) : d + 1;
    const free = e;
    let waitedFor: Row['waitedFor'];
    for (const source of instruction.sources) {
      const writer = writers.get(source);
      if (!writer) continue;
      const ready = forwarding
        ? writer.e + (writer.kind === 'load' ? 2 : 1)
        : writer.e + 3; // WB is e + 2; ID's last cycle may share it.
      if (ready > e) {
        e = ready;
        waitedFor = {
          register: source,
          producer: writer.text,
          via: forwarding ? 'forwarding' : 'register file',
        };
      }
    }
    const row: Row = {
      instruction,
      index: pc,
      cells: [],
      flushed: false,
      stalls: e - free,
      ...(waitedFor && e > free ? { waitedFor } : {}),
      ex: e,
    };
    const put = (cycle: number, cell: Cell) => (row.cells[cycle - 1] = cell);
    for (let c = f; c < d; c++) put(c, c === f ? 'IF' : 'stall');
    for (let c = d; c < e; c++) put(c, c === d ? 'ID' : 'stall');
    put(e, 'EX');
    put(e + 1, 'MEM');
    put(e + 2, 'WB');
    rows.push(row);
    if (instruction.dest)
      writers.set(instruction.dest, {
        e,
        kind: instruction.kind,
        text: instruction.text,
      });
    previous = { f, d, e };

    if (instruction.kind === 'branch' && instruction.taken) {
      if (
        instruction.target === undefined ||
        instruction.target < 0 ||
        instruction.target >= program.length
      )
        throw new RangeError('A taken branch needs a target in the program.');
      // Wrong-path instructions follow the branch through IF and ID under
      // the same hold rules, until the branch resolves at the end of EX.
      let prior = { f, d };
      for (let wrong = pc + 1, k = 0; wrong < program.length; wrong++, k++) {
        const wf = Math.max(prior.f + 1, prior.d);
        if (wf > e) break;
        const wd = Math.max(wf + 1, k === 0 ? e : prior.d + 1);
        const flushedRow: Row = {
          instruction: program[wrong]!,
          index: wrong,
          cells: [],
          flushed: true,
          stalls: 0,
        };
        for (let c = wf; c <= e; c++)
          flushedRow.cells[c - 1] = c === wf ? 'IF' : c === wd ? 'ID' : 'stall';
        flushedRow.cells[e] = 'flushed';
        rows.push(flushedRow);
        prior = { f: wf, d: wd };
      }
      redirectAt = e + 1;
      previous = { f: e, d: e + 1, e: e + 1 }; // nothing in flight behind the branch
      pc = instruction.target;
    } else pc++;
  }
  const length = Math.max(...rows.map((r) => r.cells.length));
  for (const row of rows)
    for (let c = 0; c < length; c++) row.cells[c] ??= null;
  const completed = rows.filter((r) => !r.flushed).length;
  return {
    rows,
    cycles: length,
    completed,
    bubbles: rows.reduce((n, r) => n + r.stalls, 0),
    flushed: rows.filter((r) => r.flushed).length,
  };
}

export const PROGRAMS: { id: string; label: string; program: Instruction[] }[] =
  [
    {
      id: 'load-use',
      label: 'A load, then two dependent instructions',
      program: [
        { text: 'ld r1, 0(r2)', kind: 'load', dest: 'r1', sources: ['r2'] },
        {
          text: 'add r3, r1, r4',
          kind: 'alu',
          dest: 'r3',
          sources: ['r1', 'r4'],
        },
        {
          text: 'sub r5, r3, r6',
          kind: 'alu',
          dest: 'r5',
          sources: ['r3', 'r6'],
        },
        {
          text: 'or r7, r8, r9',
          kind: 'alu',
          dest: 'r7',
          sources: ['r8', 'r9'],
        },
      ],
    },
    {
      id: 'reordered',
      label: 'The same work, independent instruction moved up',
      program: [
        { text: 'ld r1, 0(r2)', kind: 'load', dest: 'r1', sources: ['r2'] },
        {
          text: 'or r7, r8, r9',
          kind: 'alu',
          dest: 'r7',
          sources: ['r8', 'r9'],
        },
        {
          text: 'add r3, r1, r4',
          kind: 'alu',
          dest: 'r3',
          sources: ['r1', 'r4'],
        },
        {
          text: 'sub r5, r3, r6',
          kind: 'alu',
          dest: 'r5',
          sources: ['r3', 'r6'],
        },
      ],
    },
    {
      id: 'branch',
      label: 'A taken branch',
      program: [
        {
          text: 'add r1, r1, r2',
          kind: 'alu',
          dest: 'r1',
          sources: ['r1', 'r2'],
        },
        {
          text: 'beq r1, r0, L',
          kind: 'branch',
          sources: ['r1', 'r0'],
          taken: true,
          target: 4,
        },
        {
          text: 'sub r3, r3, r4',
          kind: 'alu',
          dest: 'r3',
          sources: ['r3', 'r4'],
        },
        {
          text: 'or r5, r5, r6',
          kind: 'alu',
          dest: 'r5',
          sources: ['r5', 'r6'],
        },
        {
          text: 'L: and r7, r1, r8',
          kind: 'alu',
          dest: 'r7',
          sources: ['r1', 'r8'],
        },
      ],
    },
  ];

export function pipelineExample(): string {
  return PROGRAMS.flatMap(({ id, program }) =>
    [false, true].map((forwarding) => {
      const s = schedule(program, { forwarding });
      return `${id}, forwarding ${forwarding ? 'on' : 'off'}: ${s.cycles} cycles, ${s.bubbles} bubbles, ${s.flushed} flushed`;
    }),
  ).join('\n');
}
