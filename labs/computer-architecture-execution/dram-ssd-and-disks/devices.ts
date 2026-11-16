// Teaching models of the devices below the caches: approximate latencies from
// a registered source, a DRAM bank's open row, a hard disk's positioning
// time, and a flash translation layer that must erase whole blocks.

/** Dive into Systems, Tables 1 and 2: a typical 2020 workstation. */
export const LADDER = [
  // "Under 1 ns": drawn from the chart's left edge, with an open end.
  {
    level: 'Registers',
    capacity: '4–8 bytes',
    low: 0.1,
    high: 1,
    bound: 'under 1 ns',
    openLow: true,
  },
  {
    level: 'CPU cache',
    capacity: '1–32 MB',
    low: 5,
    high: 5,
    bound: 'about 5 ns',
  },
  {
    level: 'Main memory (DRAM)',
    capacity: '4–64 GB',
    low: 100,
    high: 100,
    bound: 'about 100 ns',
  },
  {
    level: 'Flash disk (SSD)',
    capacity: '0.5–2 TB',
    low: 1e5,
    high: 1e6,
    bound: '0.1–1 ms',
  },
  {
    level: 'Hard disk',
    capacity: '0.5–10 TB',
    low: 5e6,
    high: 1e7,
    bound: '5–10 ms',
  },
  {
    level: 'Remote server',
    capacity: 'varies',
    low: 2e7,
    high: 2e8,
    bound: '20–200 ms',
  },
] as const;

export interface DramTiming {
  /** Column access: the open row's data reaches the pins. */
  cas: number;
  /** Activate: copy a row into the sense amplifiers. */
  rcd: number;
  /** Precharge: close the open row. */
  rp: number;
}
export type RowAccess = 'row hit' | 'row empty' | 'row conflict';

/** Cycles for successive accesses to one bank, by row, with an open-row policy. */
export function dramAccesses(rows: readonly number[], timing: DramTiming) {
  for (const value of [timing.cas, timing.rcd, timing.rp])
    if (!Number.isInteger(value) || value <= 0)
      throw new RangeError('Timings are positive whole cycles.');
  let open: number | null = null;
  return rows.map((row) => {
    if (!Number.isInteger(row) || row < 0)
      throw new RangeError('Rows are non-negative integers.');
    const kind: RowAccess =
      open === row ? 'row hit' : open === null ? 'row empty' : 'row conflict';
    const cycles =
      kind === 'row hit'
        ? timing.cas
        : kind === 'row empty'
          ? timing.rcd + timing.cas
          : timing.rp + timing.rcd + timing.cas;
    open = row;
    return { row, kind, cycles };
  });
}

export interface Drive {
  averageSeekMs: number;
  rpm: number;
  transferMBps: number;
}

/** OSTEP's model: T = seek + rotation (half a turn on average) + transfer. */
export function diskAccess(drive: Drive, bytes: number) {
  const { averageSeekMs, rpm, transferMBps } = drive;
  if (!(averageSeekMs >= 0 && rpm > 0 && transferMBps > 0 && bytes >= 0))
    throw new RangeError(
      'Expected non-negative seek and size, positive rpm and rate.',
    );
  const rotationMs = 60_000 / rpm / 2;
  const transferMs = (bytes / (transferMBps * 1e6)) * 1000;
  const totalMs = averageSeekMs + rotationMs + transferMs;
  return {
    seekMs: averageSeekMs,
    rotationMs,
    transferMs,
    totalMs,
    rateMBps: bytes / 1e6 / (totalMs / 1000),
  };
}

/** An illustrative 7,200 RPM drive inside the ranges the sources give. */
export const DRIVE: Drive = { averageSeekMs: 8, rpm: 7200, transferMBps: 150 };

export type PageState =
  | { state: 'erased' }
  | { state: 'valid'; page: number }
  | { state: 'invalid'; page: number };

/**
 * A log-structured flash translation layer. Writes go to the next erased page
 * of the active block; an overwrite marks the old copy invalid. One block is
 * kept erased in reserve: when no other erased page remains, garbage
 * collection copies the valid pages of the block with the fewest into the
 * reserve, then erases that block, which becomes the new reserve.
 */
export class Ftl {
  readonly blocks: PageState[][];
  private map = new Map<number, [number, number]>();
  private active = 0;
  private reserve: number;
  hostWrites = 0;
  flashWrites = 0;
  erases = 0;

  constructor(
    blockCount: number,
    readonly pagesPerBlock: number,
  ) {
    if (
      !Number.isInteger(blockCount) ||
      blockCount < 3 ||
      !Number.isInteger(pagesPerBlock) ||
      pagesPerBlock < 2
    )
      throw new RangeError('Use at least 3 blocks of at least 2 pages.');
    this.blocks = Array.from({ length: blockCount }, () =>
      Array.from({ length: pagesPerBlock }, (): PageState => ({
        state: 'erased',
      })),
    );
    this.reserve = blockCount - 1;
  }

  /** Logical pages the device can promise: everything except the reserve block. */
  get capacity(): number {
    return (this.blocks.length - 1) * this.pagesPerBlock - this.pagesPerBlock;
  }

  private free(block: number) {
    return this.blocks[block]!.findIndex((p) => p.state === 'erased');
  }

  private program(page: number) {
    let slot = this.free(this.active);
    if (slot < 0) {
      const next = this.blocks.findIndex(
        (b, i) => i !== this.reserve && b.every((p) => p.state === 'erased'),
      );
      if (next < 0) throw new Error('No erased block available.');
      this.active = next;
      slot = 0;
    }
    this.blocks[this.active]![slot] = { state: 'valid', page };
    this.map.set(page, [this.active, slot]);
    this.flashWrites++;
  }

  private collect() {
    // Victim: the full block with the fewest valid pages.
    let victim = -1;
    let fewest = Infinity;
    this.blocks.forEach((block, i) => {
      if (i === this.reserve || i === this.active) return;
      const valid = block.filter((p) => p.state === 'valid').length;
      if (valid < fewest) [victim, fewest] = [i, valid];
    });
    if (victim < 0 || fewest === this.pagesPerBlock)
      throw new Error('Device full of valid data.');
    const moving = this.blocks[victim]!.flatMap((p) =>
      p.state === 'valid' ? [p.page] : [],
    );
    this.active = this.reserve;
    for (const page of moving) this.program(page);
    this.blocks[victim] = this.blocks[victim]!.map((): PageState => ({
      state: 'erased',
    }));
    this.erases++;
    this.reserve = victim;
    return { victim, moved: moving.length };
  }

  write(page: number) {
    if (!Number.isInteger(page) || page < 0 || page >= this.capacity)
      throw new RangeError(`Logical pages are 0 to ${this.capacity - 1}.`);
    const old = this.map.get(page);
    if (old) {
      const [b, s] = old;
      this.blocks[b]![s] = { state: 'invalid', page };
    }
    let collected: { victim: number; moved: number } | undefined;
    const noRoom =
      this.free(this.active) < 0 &&
      !this.blocks.some(
        (b, i) =>
          i !== this.reserve &&
          i !== this.active &&
          b.every((p) => p.state === 'erased'),
      );
    if (noRoom) collected = this.collect();
    this.program(page);
    this.hostWrites++;
    return collected;
  }

  get writeAmplification(): number {
    return this.hostWrites === 0 ? 1 : this.flashWrites / this.hostWrites;
  }

  snapshot() {
    return {
      blocks: this.blocks.map((b) => b.map((p) => ({ ...p }))),
      reserve: this.reserve,
      hostWrites: this.hostWrites,
      flashWrites: this.flashWrites,
      erases: this.erases,
    };
  }
}

/** The lesson's flash scenario: fill, overwrite, then force garbage collection. */
export function ftlScenario() {
  const ftl = new Ftl(4, 4);
  const shots: {
    title: string;
    state: ReturnType<Ftl['snapshot']>;
    note: string;
  }[] = [];
  for (const page of [0, 1, 2, 3, 4, 5, 6, 7]) ftl.write(page);
  shots.push({
    title: 'Write logical pages 0–7',
    state: ftl.snapshot(),
    note: 'Pages fill blocks in order. Block 3 stays erased as the reserve.',
  });
  for (const page of [0, 1, 4, 5]) ftl.write(page);
  shots.push({
    title: 'Overwrite 0, 1, 4 and 5',
    state: ftl.snapshot(),
    note: 'Flash cannot rewrite a page in place: new copies go to block 2 and the old ones become invalid.',
  });
  const collected = ftl.write(2)!;
  shots.push({
    title: 'Overwrite 2: no erased page left outside the reserve',
    state: ftl.snapshot(),
    note: `Garbage collection picked block ${collected.victim}, with the fewest valid pages, copied its ${collected.moved} valid page into the reserve, and erased it. Block ${collected.victim} is the new reserve.`,
  });
  return { shots, ftl };
}

export function devicesExample(): string {
  const random = diskAccess(DRIVE, 4096);
  const sequential = diskAccess(DRIVE, 1 << 20);
  const rows = dramAccesses([7, 7, 7, 9, 7], { cas: 4, rcd: 4, rp: 4 });
  const { ftl } = ftlScenario();
  return [
    `disk 4 KiB random: ${random.totalMs.toFixed(2)} ms, ${random.rateMBps.toFixed(2)} MB/s`,
    `disk 1 MiB: ${sequential.totalMs.toFixed(2)} ms, ${sequential.rateMBps.toFixed(1)} MB/s`,
    `DRAM rows 7,7,7,9,7: ${rows.map((r) => r.cycles).join(' + ')} cycles`,
    `flash: ${ftl.hostWrites} host writes, ${ftl.flashWrites} page programs, ${ftl.erases} erase, amplification ${ftl.writeAmplification.toFixed(2)}`,
  ].join('\n');
}
