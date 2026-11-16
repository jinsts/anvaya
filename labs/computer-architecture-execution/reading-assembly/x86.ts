// A small interpreter for the subset of x86-64 (AT&T syntax) that GCC 15
// emits for this subject's functions. It parses the committed compiler
// listings directly, so the stepper runs real compiler output. It models
// 64-bit registers, the ZF/SF/CF/OF flags, a little-endian byte memory and
// the stack; it is a teaching model, not an emulator: it decodes no machine
// code and models no timing.

export type Reg =
  | 'rax'
  | 'rbx'
  | 'rcx'
  | 'rdx'
  | 'rsi'
  | 'rdi'
  | 'rbp'
  | 'rsp'
  | 'r8'
  | 'r9'
  | 'r10'
  | 'r11'
  | 'r12'
  | 'r13'
  | 'r14'
  | 'r15';

const REG64: Reg[] = [
  'rax',
  'rbx',
  'rcx',
  'rdx',
  'rsi',
  'rdi',
  'rbp',
  'rsp',
  'r8',
  'r9',
  'r10',
  'r11',
  'r12',
  'r13',
  'r14',
  'r15',
];
const REG32: Record<string, Reg> = {
  eax: 'rax',
  ebx: 'rbx',
  ecx: 'rcx',
  edx: 'rdx',
  esi: 'rsi',
  edi: 'rdi',
  ebp: 'rbp',
  esp: 'rsp',
  ...Object.fromEntries(
    [8, 9, 10, 11, 12, 13, 14, 15].map((n) => [`r${n}d`, `r${n}` as Reg]),
  ),
};

export type Operand =
  | { kind: 'reg'; reg: Reg; bits: 32 | 64 }
  | { kind: 'imm'; value: bigint }
  | { kind: 'mem'; disp: bigint; base?: Reg; index?: Reg; scale: bigint }
  | { kind: 'label'; name: string };

export interface Instruction {
  index: number;
  mnemonic: string;
  operands: Operand[];
  /** The listing line, tabs normalized to single spaces. */
  text: string;
}

export interface Listing {
  name: string;
  instructions: Instruction[];
  /** Label → index of the instruction it precedes. */
  labels: Record<string, number>;
}

function parseRegister(name: string): { reg: Reg; bits: 32 | 64 } {
  if ((REG64 as string[]).includes(name)) return { reg: name as Reg, bits: 64 };
  const reg = REG32[name];
  if (reg) return { reg, bits: 32 };
  throw new Error(`Unsupported register %${name}`);
}

/** Split operands on commas outside parentheses. */
function splitOperands(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const c of text) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else current += c;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function parseOperand(text: string): Operand {
  if (text.startsWith('%'))
    return { kind: 'reg', ...parseRegister(text.slice(1)) };
  if (text.startsWith('$'))
    return { kind: 'imm', value: BigInt(text.slice(1)) };
  const mem = /^(-?\d+)?\((%\w+)?(?:,(%\w+)(?:,(\d))?)?\)$/.exec(text);
  if (mem) {
    const [, disp, base, index, scale] = mem;
    return {
      kind: 'mem',
      disp: BigInt(disp ?? 0),
      ...(base ? { base: parseRegister(base.slice(1)).reg } : {}),
      ...(index ? { index: parseRegister(index.slice(1)).reg } : {}),
      scale: BigInt(scale ?? 1),
    };
  }
  if (/^[\w.]+(@PLT)?$/.test(text))
    return { kind: 'label', name: text.replace('@PLT', '') };
  throw new Error(`Unsupported operand ${text}`);
}

/** Parse one function listing as GCC writes it with -S. */
export function parseListing(text: string): Listing {
  const instructions: Instruction[] = [];
  const labels: Record<string, number> = {};
  let name = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const label = /^([\w.]+):$/.exec(line);
    if (label) {
      labels[label[1]!] = instructions.length;
      if (!name && !label[1]!.startsWith('.')) name = label[1]!;
      continue;
    }
    if (line.startsWith('.')) continue; // assembler directive
    const [mnemonic, ...rest] = line.split(/\s+/);
    const operandText = rest.join(' ');
    instructions.push({
      index: instructions.length,
      mnemonic: mnemonic!,
      operands: operandText ? splitOperands(operandText).map(parseOperand) : [],
      text: line.replace(/\s+/g, ' '),
    });
  }
  if (!name) throw new Error('Listing has no function label');
  return { name, instructions, labels };
}

export interface Flags {
  ZF: boolean | null;
  SF: boolean | null;
  CF: boolean | null;
  OF: boolean | null;
}

const M64 = (1n << 64n) - 1n;
const mask = (bits: number) => (1n << BigInt(bits)) - 1n;
const signBit = (value: bigint, bits: number) =>
  (value >> BigInt(bits - 1)) & 1n;
export const toSigned = (value: bigint, bits: number) =>
  signBit(value, bits) ? value - (1n << BigInt(bits)) : value;

/** Where the test harness's call returned to; ret to it ends the run. */
export const HARNESS_RETURN = 0x401000n;
/** The stack pointer before the harness's call: 16-byte aligned. */
export const STACK_TOP = 0x7ffffffde000n;
const CODE_BASE = 0x402000n;

export interface StepRecord {
  function: string;
  index: number;
  text: string;
  registers: Record<Reg, bigint>;
  flags: Flags;
  /** Registers written by this instruction, by their 64-bit names. */
  wrote: Reg[];
  /** Memory addresses (lowest byte) written, with widths. */
  stored: { address: bigint; bytes: number }[];
  flagsChanged: boolean;
  /** For conditional jumps: whether the jump was taken. */
  taken?: boolean;
  /** rsp when a call instruction executes, to check ABI alignment. */
  rspAtCall?: bigint;
  /** 8-byte stack words from rsp up to the harness's frame, top first. */
  stack: { address: bigint; value: bigint | null }[];
  /** Bytes of each watched range after this step. */
  watched: number[][];
}

export interface RunOptions {
  args?: bigint[];
  /** Memory ranges to read after every step, for figures. */
  watch?: { address: bigint; bytes: number }[];
  memory?: { address: bigint; bytes: number[] }[];
  maxSteps?: number;
}

const ARG_REGS: Reg[] = ['rdi', 'rsi', 'rdx', 'rcx', 'r8', 'r9'];
// Callee-saved registers start with recognizable values so preservation shows.
const START: Partial<Record<Reg, bigint>> = {
  rbx: 0xb0b0n,
  rbp: 0x7ffffffde100n,
  r12: 0xc12n,
  r13: 0xc13n,
  r14: 0xc14n,
  r15: 0xc15n,
};

export function run(
  listings: readonly Listing[],
  entry: string,
  options: RunOptions = {},
) {
  const byName = new Map(
    listings.map((l, i) => [
      l.name,
      { listing: l, base: CODE_BASE + BigInt(i) * 0x1000n },
    ]),
  );
  const regs = Object.fromEntries(
    REG64.map((r) => [r, START[r] ?? 0n]),
  ) as Record<Reg, bigint>;
  const memory = new Map<bigint, number>();
  const flags: Flags = { ZF: null, SF: null, CF: null, OF: null };
  (options.args ?? []).forEach(
    (value, i) => (regs[ARG_REGS[i]!] = value & M64),
  );
  for (const block of options.memory ?? [])
    block.bytes.forEach((b, i) =>
      memory.set(block.address + BigInt(i), b & 0xff),
    );

  const readMem = (address: bigint, bytes: number) => {
    let value = 0n;
    for (let i = bytes - 1; i >= 0; i--) {
      const byte = memory.get((address + BigInt(i)) & M64);
      if (byte === undefined)
        throw new RangeError(
          `Read of uninitialized memory at 0x${address.toString(16)}`,
        );
      value = (value << 8n) | BigInt(byte);
    }
    return value;
  };
  const writeMem = (address: bigint, bytes: number, value: bigint) => {
    for (let i = 0; i < bytes; i++)
      memory.set(
        (address + BigInt(i)) & M64,
        Number((value >> BigInt(8 * i)) & 0xffn),
      );
  };
  // Push the harness's return address, as its call instruction would.
  regs.rsp = STACK_TOP - 8n;
  writeMem(regs.rsp, 8, HARNESS_RETURN);

  const ea = (op: Extract<Operand, { kind: 'mem' }>) =>
    (op.disp +
      (op.base ? regs[op.base] : 0n) +
      (op.index ? regs[op.index] * op.scale : 0n)) &
    M64;
  const read = (op: Operand, bits: number): bigint => {
    if (op.kind === 'reg') return regs[op.reg] & mask(bits);
    if (op.kind === 'imm') return op.value & mask(bits);
    if (op.kind === 'mem') return readMem(ea(op), bits / 8);
    throw new Error('A label is not a value');
  };
  const wrote: Reg[] = [];
  const stored: StepRecord['stored'] = [];
  const write = (op: Operand, bits: number, value: bigint) => {
    if (op.kind === 'reg') {
      // Writing a 32-bit register zero-extends into the full 64-bit register.
      regs[op.reg] = value & mask(bits === 32 ? 32 : 64);
      wrote.push(op.reg);
    } else if (op.kind === 'mem') {
      writeMem(ea(op), bits / 8, value);
      stored.push({ address: ea(op), bytes: bits / 8 });
    } else throw new Error('Cannot write to this operand');
  };
  const setResultFlags = (result: bigint, bits: number) => {
    flags.ZF = result === 0n;
    flags.SF = signBit(result, bits) === 1n;
  };
  const push = (value: bigint) => {
    regs.rsp = (regs.rsp - 8n) & M64;
    writeMem(regs.rsp, 8, value);
    wrote.push('rsp');
    stored.push({ address: regs.rsp, bytes: 8 });
  };
  const pop = () => {
    const value = readMem(regs.rsp, 8);
    regs.rsp = (regs.rsp + 8n) & M64;
    wrote.push('rsp');
    return value;
  };
  const condition = (code: string): boolean => {
    const need = (...names: (keyof Flags)[]) => {
      for (const n of names)
        if (flags[n] === null) throw new Error(`Flag ${n} is undefined here`);
    };
    switch (code) {
      case 'e':
        need('ZF');
        return flags.ZF!;
      case 'ne':
        need('ZF');
        return !flags.ZF;
      case 'l':
        need('SF', 'OF');
        return flags.SF !== flags.OF;
      case 'le':
        need('ZF', 'SF', 'OF');
        return flags.ZF! || flags.SF !== flags.OF;
      case 'g':
        need('ZF', 'SF', 'OF');
        return !flags.ZF && flags.SF === flags.OF;
      case 'ge':
        need('SF', 'OF');
        return flags.SF === flags.OF;
      case 'b':
        need('CF');
        return flags.CF!;
      case 'be':
        need('CF', 'ZF');
        return flags.CF! || flags.ZF!;
      case 'a':
        need('CF', 'ZF');
        return !flags.CF && !flags.ZF;
      case 'ae':
        need('CF');
        return !flags.CF;
      default:
        throw new Error(`Unsupported condition ${code}`);
    }
  };

  // Reserved but never written stack slots read as null.
  const stackWords = () => {
    const words: StepRecord['stack'] = [];
    for (let a = regs.rsp; a < STACK_TOP; a += 8n) {
      const known = [...Array(8).keys()].every((i) =>
        memory.has(a + BigInt(i)),
      );
      words.push({ address: a, value: known ? readMem(a, 8) : null });
    }
    return words;
  };

  const watchBytes = () =>
    (options.watch ?? []).map(({ address, bytes }) =>
      [...Array(bytes).keys()].map((i) => memory.get(address + BigInt(i)) ?? 0),
    );
  const initial = {
    registers: { ...regs },
    flags: { ...flags },
    stack: stackWords(),
    watched: watchBytes(),
  };

  let current = byName.get(entry);
  if (!current) throw new Error(`No listing for ${entry}`);
  let pc = 0;
  const steps: StepRecord[] = [];
  const maxSteps = options.maxSteps ?? 1000;
  for (;;) {
    if (steps.length >= maxSteps) throw new RangeError('Step limit reached');
    const { listing } = current;
    const instruction = listing.instructions[pc];
    if (!instruction)
      throw new RangeError(`Ran past the end of ${listing.name}`);
    const [a, b] = instruction.operands;
    const m = instruction.mnemonic;
    const width = m.endsWith('q') ? 64 : 32;
    wrote.length = 0;
    stored.length = 0;
    let flagsChanged = false;
    let next = pc + 1;
    let taken: boolean | undefined;
    let rspAtCall: bigint | undefined;
    let halt = false;
    const jumpTo = (op: Operand | undefined) => {
      if (op?.kind !== 'label' || listing.labels[op.name] === undefined)
        throw new Error(`Unknown jump target in ${instruction.text}`);
      return listing.labels[op.name]!;
    };
    if (m === 'endbr64') {
      // A landing pad for indirect branches (Intel CET); no state change.
    } else if (m === 'movl' || m === 'movq') write(b!, width, read(a!, width));
    else if (m === 'movslq') write(b!, 64, toSigned(read(a!, 32), 32) & M64);
    else if (m === 'cltq')
      write(
        { kind: 'reg', reg: 'rax', bits: 64 },
        64,
        toSigned(regs.rax & mask(32), 32) & M64,
      );
    else if (m === 'leal' || m === 'leaq') {
      if (a?.kind !== 'mem') throw new Error('lea needs a memory operand');
      write(b!, width, ea(a) & mask(width));
    } else if (m === 'addl' || m === 'addq') {
      const x = read(b!, width);
      const y = read(a!, width);
      const result = (x + y) & mask(width);
      write(b!, width, result);
      setResultFlags(result, width);
      flags.CF = x + y > mask(width);
      flags.OF =
        signBit(x, width) === signBit(y, width) &&
        signBit(result, width) !== signBit(x, width);
      flagsChanged = true;
    } else if (['subl', 'subq', 'cmpl', 'cmpq'].includes(m)) {
      const x = read(b!, width);
      const y = read(a!, width);
      const result = (x - y) & mask(width);
      if (m.startsWith('sub')) write(b!, width, result);
      setResultFlags(result, width);
      flags.CF = x < y;
      flags.OF =
        signBit(x, width) !== signBit(y, width) &&
        signBit(result, width) !== signBit(x, width);
      flagsChanged = true;
    } else if (['xorl', 'xorq', 'testl', 'testq'].includes(m)) {
      const x = read(b!, width);
      const y = read(a!, width);
      const result = m.startsWith('xor') ? x ^ y : x & y;
      if (m.startsWith('xor')) write(b!, width, result);
      setResultFlags(result, width);
      flags.CF = false;
      flags.OF = false;
      flagsChanged = true;
    } else if (m === 'imull') {
      const full = toSigned(read(b!, 32), 32) * toSigned(read(a!, 32), 32);
      const result = full & mask(32);
      write(b!, 32, result);
      flags.CF = flags.OF = toSigned(result, 32) !== full;
      flags.ZF = flags.SF = null; // undefined after imul
      flagsChanged = true;
    } else if (m === 'pushq') push(read(a!, 64));
    else if (m === 'popq') write(a!, 64, pop());
    else if (m === 'leave') {
      regs.rsp = regs.rbp;
      regs.rbp = pop();
      wrote.push('rbp');
    } else if (m === 'call') {
      if (a?.kind !== 'label') throw new Error('call needs a label');
      const target = byName.get(a.name);
      if (!target) throw new Error(`No listing for ${a.name}`);
      rspAtCall = regs.rsp;
      push(current.base + BigInt(pc + 1));
      current = target;
      next = 0;
    } else if (m === 'ret') {
      const address = pop();
      if (address === HARNESS_RETURN) halt = true;
      else {
        const caller = [...byName.values()].find(
          (f) => address >= f.base && address < f.base + 0x1000n,
        );
        if (!caller)
          throw new Error(`ret to unknown address 0x${address.toString(16)}`);
        current = caller;
        next = Number(address - caller.base);
      }
    } else if (m === 'jmp') next = jumpTo(a);
    else if (/^j[a-z]+$/.test(m)) {
      taken = condition(m.slice(1));
      if (taken) next = jumpTo(a);
    } else throw new Error(`Unsupported instruction ${instruction.text}`);

    steps.push({
      function: listing.name,
      index: pc,
      text: instruction.text,
      registers: { ...regs },
      flags: { ...flags },
      wrote: [...new Set(wrote)],
      stored: [...stored],
      flagsChanged,
      ...(taken === undefined ? {} : { taken }),
      ...(rspAtCall === undefined ? {} : { rspAtCall }),
      stack: stackWords(),
      watched: watchBytes(),
    });
    if (halt) break;
    pc = next;
  }
  return {
    initial,
    steps,
    result: regs.rax,
    registers: { ...regs },
    readMemory: (address: bigint, bytes: number) => readMem(address, bytes),
  };
}

/** Little-endian bytes of 32-bit integers, for loading an int array. */
export function int32Bytes(values: readonly number[]): number[] {
  return values.flatMap((v) =>
    [0, 8, 16, 24].map((shift) => (v >>> shift) & 0xff),
  );
}

/** Describe a stack word: a return address into a listing, or a raw value. */
export function codeAddress(
  listings: readonly Listing[],
  value: bigint,
): { function: string; index: number } | null {
  const i = Number((value - CODE_BASE) / 0x1000n);
  if (value < CODE_BASE || i >= listings.length) return null;
  return {
    function: listings[i]!.name,
    index: Number(value - CODE_BASE - BigInt(i) * 0x1000n),
  };
}

export interface Block {
  first: number;
  last: number;
  labels: string[];
  /** Successor block indexes: the jump target and/or the next block. */
  jump?: number;
  fallthrough?: number;
}

/** Split a listing into basic blocks and connect them. */
export function basicBlocks(listing: Listing): Block[] {
  const { instructions, labels } = listing;
  const leaders = new Set<number>([0]);
  for (const index of Object.values(labels)) leaders.add(index);
  instructions.forEach((instruction, i) => {
    if (/^j|^ret$/.test(instruction.mnemonic) && i + 1 < instructions.length)
      leaders.add(i + 1);
  });
  const starts = [...leaders]
    .filter((i) => i < instructions.length)
    .sort((a, b) => a - b);
  const blockOf = (index: number) =>
    starts.findIndex(
      (s, k) => index >= s && index < (starts[k + 1] ?? Infinity),
    );
  return starts.map((first, k) => {
    const last = (starts[k + 1] ?? instructions.length) - 1;
    const end = instructions[last]!;
    const block: Block = {
      first,
      last,
      // GCC's .LFB/.LFE labels mark function bounds for unwind data.
      labels: Object.entries(labels)
        .filter(([name, i]) => i === first && !/^\.LF[BE]\d+$/.test(name))
        .map(([name]) => name),
    };
    const target = end.operands[0];
    if (end.mnemonic.startsWith('j') && target?.kind === 'label')
      block.jump = blockOf(labels[target.name]!);
    if (
      end.mnemonic !== 'ret' &&
      end.mnemonic !== 'jmp' &&
      k + 1 < starts.length
    )
      block.fallthrough = k + 1;
    return block;
  });
}

export type Jump =
  'je' | 'jne' | 'jl' | 'jle' | 'jg' | 'jge' | 'jb' | 'jbe' | 'ja' | 'jae';

/** Whether `cmpl right, left` followed by the jump jumps, by running it. */
export function jumpTaken(jump: Jump, left: number, right: number): boolean {
  const program = parseListing(
    `f:\n\tcmpl\t%esi, %edi\n\t${jump}\t.L1\n\tmovl\t$0, %eax\n\tret\n.L1:\n\tmovl\t$1, %eax\n\tret\n`,
  );
  const bits = (n: number) => BigInt(n) & 0xffffffffn;
  return run([program], 'f', { args: [bits(left), bits(right)] }).result === 1n;
}
