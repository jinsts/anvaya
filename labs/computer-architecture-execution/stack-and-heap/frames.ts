// Reads the stack frames of GCC's -O0 scale_sum and sum_to while sum_to runs.
// Slot names come from the prologue's stores: an argument register's
// parameter, or the order of constant initializers. The values are read from
// the reading-assembly interpreter's memory, so the figure shows real offsets
// with the values the program would hold there.
import {
  HARNESS_RETURN,
  STACK_TOP,
  codeAddress,
  int32Bytes,
  run,
  type Listing,
  type Reg,
} from '../reading-assembly/x86';

export interface Slot {
  offset: number;
  bytes: number;
  name: string;
  from: string;
}

/** Stores to negative rbp offsets, named by source register or constant. */
export function frameSlots(
  listing: Listing,
  registers: Partial<Record<Reg, string>>,
  constants: string[] = [],
): Slot[] {
  const slots: Slot[] = [];
  let constant = 0;
  for (const instruction of listing.instructions) {
    const [source, target] = instruction.operands;
    if (
      !/^mov[lq]$/.test(instruction.mnemonic) ||
      target?.kind !== 'mem' ||
      target.base !== 'rbp' ||
      target.disp >= 0n ||
      slots.some((s) => s.offset === Number(target.disp))
    )
      continue;
    const bytes = instruction.mnemonic === 'movq' ? 8 : 4;
    const register = instruction.text.split(' ')[1]!.replace(',', '');
    if (source?.kind === 'reg') {
      const name = registers[source.reg];
      if (name)
        slots.push({
          offset: Number(target.disp),
          bytes,
          name,
          from: register,
        });
    } else if (source?.kind === 'imm' && constant < constants.length)
      slots.push({
        offset: Number(target.disp),
        bytes,
        name: constants[constant++]!,
        from: `$${source.value}`,
      });
  }
  return slots;
}

export interface FrameRow {
  address: bigint;
  label: string;
  value: string;
  frame: 'scale_sum' | 'sum_to';
  /** Below sum_to's rsp: the red zone a leaf function may use. */
  belowRsp: boolean;
}

export const SCALE_NAMES: Partial<Record<Reg, string>> = {
  rdi: 'values',
  rsi: 'count',
  rdx: 'factor',
};
export const SUM_NAMES: Partial<Record<Reg, string>> = {
  rdi: 'values',
  rsi: 'count',
};
export const SUM_CONSTANTS = ['total', 'i'];

export function realFrames(scaleO0: Listing, sumO0: Listing): FrameRow[] {
  const values = 0x5000n;
  const window = { address: STACK_TOP - 160n, bytes: 160 };
  const { steps } = run([scaleO0, sumO0], 'scale_sum', {
    args: [values, 4n, 2n],
    memory: [{ address: values, bytes: int32Bytes([3, 5, 7, 9]) }],
    watch: [window],
  });
  // The moment sum_to has stored its locals: its last prologue store.
  const sumSlots = frameSlots(sumO0, SUM_NAMES, SUM_CONSTANTS);
  const last = sumSlots.at(-1)!.offset;
  const step = steps.find(
    (s) =>
      s.function === 'sum_to' &&
      s.stored.some((w) => Number(w.address - s.registers.rbp) === last),
  )!;
  const bytes = step.watched[0]!;
  const read = (address: bigint, n: number) => {
    let v = 0n;
    for (let i = n - 1; i >= 0; i--)
      v = (v << 8n) | BigInt(bytes[Number(address - window.address) + i]!);
    return v;
  };
  const sumRbp = step.registers.rbp;
  const scaleRbp = read(sumRbp, 8);
  const scaleSlots = frameSlots(scaleO0, SCALE_NAMES);
  const listings = [scaleO0, sumO0];
  const describe = (word: bigint) => {
    if (word === HARNESS_RETURN) return 'return address → the caller';
    const code = codeAddress(listings, word);
    if (!code) return `0x${word.toString(16)}`;
    const text = listings.find((l) => l.name === code.function)!.instructions[
      code.index
    ]!.text;
    return `return address → ${code.function}, at ${text}`;
  };
  const show = (slot: Slot, value: bigint) =>
    slot.name === 'values' ? `0x${value.toString(16)}` : String(value);
  const slotRows = (
    frame: FrameRow['frame'],
    rbp: bigint,
    slots: Slot[],
  ): FrameRow[] =>
    slots.map((s) => ({
      address: rbp + BigInt(s.offset),
      label: `rbp${s.offset}`,
      value: `${s.name} = ${show(s, read(rbp + BigInt(s.offset), s.bytes))}, stored from ${s.from}`,
      frame,
      belowRsp: rbp + BigInt(s.offset) < step.registers.rsp,
    }));
  const rows: FrameRow[] = [
    {
      address: scaleRbp + 8n,
      label: 'rbp+8',
      value: describe(read(scaleRbp + 8n, 8)),
      frame: 'scale_sum',
      belowRsp: false,
    },
    {
      address: scaleRbp,
      label: 'rbp',
      value: "saved rbp of scale_sum's caller",
      frame: 'scale_sum',
      belowRsp: false,
    },
    ...slotRows('scale_sum', scaleRbp, scaleSlots),
    {
      address: sumRbp + 8n,
      label: 'rbp+8',
      value: describe(read(sumRbp + 8n, 8)),
      frame: 'sum_to',
      belowRsp: false,
    },
    {
      address: sumRbp,
      label: 'rbp',
      value: "saved rbp = scale_sum's rbp",
      frame: 'sum_to',
      belowRsp: false,
    },
    ...slotRows('sum_to', sumRbp, sumSlots),
  ];
  return rows.sort((a, b) => (a.address > b.address ? -1 : 1));
}
