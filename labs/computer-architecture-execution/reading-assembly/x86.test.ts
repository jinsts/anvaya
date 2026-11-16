import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { SCALE_O2, SUM_O2 } from './annotations';
import {
  HARNESS_RETURN,
  basicBlocks,
  codeAddress,
  STACK_TOP,
  int32Bytes,
  parseListing,
  parseOperand,
  run,
  toSigned,
} from './x86';

const lab = 'labs/computer-architecture-execution';
const listing = (file: string) =>
  parseListing(readFileSync(`${lab}/${file}`, 'utf8'));
const sumO0 = listing('reading-assembly/sum-O0.txt');
const sumO2 = listing('reading-assembly/sum-O2.txt');
const scaleO0 = listing('reading-assembly/scale-O0.txt');
const scaleO2 = listing('reading-assembly/scale-O2.txt');
const ARRAY = 0x5000n;
const values = { address: ARRAY, bytes: int32Bytes([3, 5, 7, 9]) };

it('parses AT&T operands, labels and directives from a real listing', () => {
  expect(parseOperand('(%rdi,%rsi,4)')).toEqual({
    kind: 'mem',
    disp: 0n,
    base: 'rdi',
    index: 'rsi',
    scale: 4n,
  });
  expect(parseOperand('-8(%rbp)')).toEqual({
    kind: 'mem',
    disp: -8n,
    base: 'rbp',
    scale: 1n,
  });
  expect(parseOperand('0(,%rax,4)')).toMatchObject({ index: 'rax', scale: 4n });
  expect(parseOperand('sum_to@PLT')).toEqual({ kind: 'label', name: 'sum_to' });
  expect(parseOperand('%esi')).toEqual({ kind: 'reg', reg: 'rsi', bits: 32 });
  expect(() => parseOperand('%xmm0')).toThrow();
  expect(sumO2.name).toBe('sum_to');
  expect(sumO2.instructions.map((i) => i.mnemonic)).toEqual([
    'endbr64',
    'testl',
    'jle',
    'movslq',
    'xorl',
    'leaq',
    'addl',
    'addq',
    'cmpq',
    'jne',
    'ret',
    'xorl',
    'ret',
  ]);
  expect(sumO2.labels['.L3']).toBe(6);
});

it('computes the same results as the native program at -O0 and -O2', () => {
  for (const sum of [sumO0, sumO2]) {
    const four = run([sum], 'sum_to', { args: [ARRAY, 4n], memory: [values] });
    expect(four.result & 0xffffffffn).toBe(24n);
    const none = run([sum], 'sum_to', { args: [ARRAY, 0n], memory: [values] });
    expect(none.result & 0xffffffffn).toBe(0n);
  }
  for (const [scale, sum] of [
    [scaleO0, sumO0],
    [scaleO2, sumO2],
  ] as const) {
    const scaled = run([scale, sum], 'scale_sum', {
      args: [ARRAY, 4n, 2n],
      memory: [values],
    });
    expect(scaled.result & 0xffffffffn).toBe(48n);
  }
});

it('follows the calling convention: preserved rbx, aligned calls, balanced stack', () => {
  const before = run([sumO2], 'sum_to', { args: [ARRAY, 0n], memory: [values] })
    .steps[0]!.registers.rbx;
  const { steps, registers } = run([scaleO2, sumO2], 'scale_sum', {
    args: [ARRAY, 4n, 3n],
    memory: [values],
  });
  expect(registers.rbx).toBe(before);
  expect(registers.rsp).toBe(STACK_TOP);
  const call = steps.find((s) => s.rspAtCall !== undefined)!;
  // The psABI requires a 16-byte aligned stack immediately before call.
  expect(call.rspAtCall! % 16n).toBe(0n);
  // factor travels in rbx across the call, then multiplies the sum.
  const mov = steps.find((s) => s.text === 'movl %edx, %ebx')!;
  expect(mov.registers.rbx).toBe(3n);
  expect(registers.rax & 0xffffffffn).toBe(72n);
  expect(steps.at(-1)!.text).toBe('ret');
  expect(HARNESS_RETURN).toBeGreaterThan(0n);
});

it('counts executed instructions: -O2 runs fewer for the same input', () => {
  const count = (sum: typeof sumO0) =>
    run([sum], 'sum_to', { args: [ARRAY, 4n], memory: [values] }).steps.length;
  // -O0: 8 prologue + 4 × 8 body + 5 × 3 condition + 3 epilogue.
  expect(count(sumO0)).toBe(58);
  // -O2: 6 before the loop + 4 × 4 loop + ret.
  expect(count(sumO2)).toBe(23);
  const branches = run([sumO2], 'sum_to', {
    args: [ARRAY, 4n],
    memory: [values],
  }).steps.filter((s) => s.taken !== undefined);
  expect(branches.map((b) => b.taken)).toEqual([
    false,
    true,
    true,
    true,
    false,
  ]);
});

it('backs the lesson’s loop trace table', () => {
  const { steps } = run([sumO2], 'sum_to', {
    args: [ARRAY, 4n],
    memory: [values],
  });
  const low = (r: bigint) => r & 0xffffffffn;
  expect(
    steps
      .filter((s) => s.text === 'addl (%rdi), %eax')
      .map((s) => low(s.registers.rax)),
  ).toEqual([3n, 8n, 15n, 24n]);
  expect(
    steps.filter((s) => s.text === 'addq $4, %rdi').map((s) => s.registers.rdi),
  ).toEqual([0x5004n, 0x5008n, 0x500cn, 0x5010n]);
  expect(steps.find((s) => s.text.startsWith('leaq'))!.registers.rdx).toBe(
    0x5010n,
  );
  expect(steps.filter((s) => s.text === 'jne .L3').map((s) => s.taken)).toEqual(
    [true, true, true, false],
  );
});

it('runs the bump listings from the compilation lab', () => {
  const bumpO2 = listing('compilation-and-execution/native/bump-O2.txt');
  const bumpO0 = listing('compilation-and-execution/native/bump-O0.txt');
  for (const bump of [bumpO0, bumpO2]) {
    const result = run([bump], 'bump', {
      args: [0x6000n],
      memory: [{ address: 0x6000n, bytes: int32Bytes([7]) }],
    });
    expect(result.result & 0xffffffffn).toBe(8n);
    expect(result.readMemory(0x6000n, 4)).toBe(8n);
  }
  const steps = run([bumpO2], 'bump', {
    args: [0x6000n],
    memory: [{ address: 0x6000n, bytes: int32Bytes([7]) }],
  }).steps;
  expect(steps.map((s) => [s.text, s.wrote, s.stored.length])).toEqual([
    ['endbr64', [], 0],
    ['movl (%rdi), %eax', ['rax'], 0],
    ['addl $1, %eax', ['rax'], 0],
    ['movl %eax, (%rdi)', [], 1],
    ['ret', ['rsp'], 0],
  ]);
});

// Hand-written two-line functions isolate one flag rule each.
const compare = (jump: string, width: 'l' | 'q' = 'l') =>
  parseListing(
    `f:\n\tcmp${width}\t%esi, %edi\n\t${jump}\t.L1\n\tmovl\t$0, %eax\n\tret\n.L1:\n\tmovl\t$1, %eax\n\tret\n`.replace(
      width === 'q' ? /%e(si|di)/g : /$^/,
      '%r$1',
    ),
  );
const jumps = (jump: string, left: bigint, right: bigint) =>
  run([compare(jump)], 'f', { args: [left & 0xffffffffn, right & 0xffffffffn] })
    .result === 1n;

it('evaluates signed and unsigned conditions from cmp flags', () => {
  const MIN = -(2n ** 31n);
  // jl is signed less-than: SF ≠ OF, which handles overflow in left − right.
  expect(jumps('jl', MIN, 1n)).toBe(true);
  expect(jumps('jl', 1n, MIN)).toBe(false);
  expect(jumps('jl', -1n, 0n)).toBe(true);
  // jb is unsigned below: the same bits, −1 is 0xffffffff.
  expect(jumps('jb', -1n, 0n)).toBe(false);
  expect(jumps('jb', 0n, -1n)).toBe(true);
  expect(jumps('jle', 5n, 5n)).toBe(true);
  expect(jumps('jne', 5n, 5n)).toBe(false);
  expect(jumps('jbe', 5n, 5n)).toBe(true);
  expect(toSigned(0xffffffffn, 32)).toBe(-1n);
});

it('marks flags undefined after imul and rejects unsupported code', () => {
  const imul = parseListing(
    'f:\n\timull\t%esi, %edi\n\tje\t.L1\n.L1:\n\tret\n',
  );
  expect(() => run([imul], 'f', { args: [2n, 3n] })).toThrow(/undefined/);
  expect(() => parseListing('f:\n\tpaddd\t%xmm1, %xmm0\n\tret\n')).toThrow(
    /Unsupported register/,
  );
  const unknown = parseListing('f:\n\tcpuid\n\tret\n');
  expect(() => run([unknown], 'f')).toThrow(/Unsupported instruction/);
  const loop = parseListing('f:\n.L1:\n\tjmp\t.L1\n');
  expect(() => run([loop], 'f', { maxSteps: 10 })).toThrow(RangeError);
});

it('splits listings into basic blocks with a backward edge for the loop', () => {
  expect(
    basicBlocks(sumO2).map((b) => [
      b.first,
      b.last,
      b.labels,
      b.jump,
      b.fallthrough,
    ]),
  ).toEqual([
    [0, 2, ['sum_to'], 4, 1],
    [3, 5, [], undefined, 2],
    [6, 9, ['.L3'], 2, 3],
    [10, 10, [], undefined, undefined],
    [11, 12, ['.L4'], undefined, undefined],
  ]);
  // -O0 tests the condition at the bottom: jmp to .L2, then jl back to .L3.
  const o0 = basicBlocks(sumO0);
  const cond = o0.findIndex((b) => b.labels.includes('.L2'));
  const body = o0.findIndex((b) => b.labels.includes('.L3'));
  expect(o0[0]!.jump).toBe(cond);
  expect(o0[0]!.fallthrough).toBeUndefined();
  expect(o0[cond]!.jump).toBe(body);
  expect(body).toBeLessThan(cond);
});

it('shows the stack holding saved rbx and two return addresses', () => {
  const listings = [scaleO2, sumO2];
  const { steps } = run(listings, 'scale_sum', {
    args: [ARRAY, 4n, 2n],
    memory: [values],
  });
  const afterPush = steps.find((s) => s.text === 'pushq %rbx')!;
  expect(afterPush.stack.map((w) => w.value)).toEqual([
    0xb0b0n,
    HARNESS_RETURN,
  ]);
  const inside = steps.find((s) => s.function === 'sum_to')!;
  const top = codeAddress(listings, inside.stack[0]!.value!);
  expect(top).toEqual({
    function: 'scale_sum',
    index: scaleO2.instructions.findIndex((i) => i.mnemonic === 'imull'),
  });
  expect(codeAddress(listings, 0xb0b0n)).toBeNull();
});

it('keeps the lesson annotations in step with the committed listings', () => {
  const source =
    readFileSync(`${lab}/reading-assembly/sum.c`, 'utf8') +
    readFileSync(`${lab}/reading-assembly/scale.c`, 'utf8');
  for (const [annotations, listed] of [
    [SUM_O2, sumO2],
    [SCALE_O2, scaleO2],
  ] as const) {
    expect(annotations.flatMap((a) => a.instructions)).toEqual(
      listed.instructions.map((i) => i.text).filter((t) => t !== 'endbr64'),
    );
    for (const line of annotations.flatMap((a) => a.source))
      expect(source.split('\n')).toContain(line);
  }
});
