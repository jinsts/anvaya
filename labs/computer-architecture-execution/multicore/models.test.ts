import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import {
  allowedOrders,
  MESI_SCRIPT,
  falseSharing,
  lostUpdate,
  mesi,
  messagePassing,
  parseAccesses,
  multicoreExample,
  storeBuffering,
  type MemoryOp,
} from './models';

it('follows MESI transitions for reads, writes and ownership requests', () => {
  const steps = mesi([
    { core: 0, op: 'read' },
    { core: 1, op: 'read' },
    { core: 0, op: 'write' },
    { core: 1, op: 'read' },
    { core: 1, op: 'write' },
    { core: 0, op: 'write' },
  ]);
  expect(
    steps.map((s) => [
      s.before.join(''),
      s.after.join(''),
      s.message,
      s.effect,
    ]),
  ).toEqual([
    ['II', 'EI', 'read miss', 'none'],
    ['EI', 'SS', 'read miss', 'downgraded to S'],
    ['SS', 'MI', 'request for ownership', 'invalidated'],
    ['MI', 'SS', 'read miss', 'supplied data, downgraded to S'],
    ['SS', 'IM', 'request for ownership', 'invalidated'],
    ['IM', 'MI', 'request for ownership', 'supplied data, invalidated'],
  ]);
  // The lesson's script: accesses 3, 5 and 6 request ownership; 7 hits.
  const script = mesi(MESI_SCRIPT);
  expect(
    script.flatMap((s, i) =>
      s.message === 'request for ownership' ? [i + 1] : [],
    ),
  ).toEqual([3, 5, 6]);
  expect(script[6]).toMatchObject({ hit: true, message: 'none' });
  // Exclusive upgrades to Modified silently.
  const silent = mesi([
    { core: 0, op: 'read' },
    { core: 0, op: 'write' },
  ]);
  expect(silent[1]).toMatchObject({ after: ['M', 'I'], message: 'none' });
  // At most one Modified or Exclusive copy, never alongside a valid copy.
  for (const s of steps) {
    const owners = s.after.filter((x) => x === 'M' || x === 'E').length;
    expect(owners === 0 || s.after.includes('I')).toBe(true);
  }
});

it('makes alternating writers to one line request ownership every time', () => {
  const result = falseSharing(8);
  expect(result.sharedOwnershipRequests).toBe(8);
  expect(result.paddedOwnershipRequests).toBe(2);
});

it('forbids reading the flag without the data only under release/acquire', () => {
  expect(messagePassing(false).map((o) => o.outcome)).toContain('r1=1, r2=0');
  expect(messagePassing(true)).toEqual([
    { outcome: 'r1=0, r2=0', executions: 1 },
    { outcome: 'r1=0, r2=42', executions: 4 },
    { outcome: 'r1=1, r2=42', executions: 1 },
  ]);
  const store = (location: string, order: MemoryOp['order']): MemoryOp => ({
    kind: 'store',
    location,
    value: 1,
    order,
  });
  // A release store keeps earlier accesses before it; relaxed ones may swap.
  expect(
    allowedOrders([store('x', 'relaxed'), store('y', 'release')]),
  ).toHaveLength(1);
  expect(
    allowedOrders([store('x', 'relaxed'), store('y', 'relaxed')]),
  ).toHaveLength(2);
  expect(
    allowedOrders([store('x', 'relaxed'), store('x', 'relaxed')]),
  ).toHaveLength(1);
});

it('lets store buffering read two zeros even under release/acquire', () => {
  const all = ['r1=0, r2=0', 'r1=0, r2=1', 'r1=1, r2=0', 'r1=1, r2=1'];
  expect(storeBuffering(false).map((o) => o.outcome)).toEqual(all);
  // A release store does not keep a later acquire load after it.
  expect(storeBuffering(true).map((o) => o.outcome)).toEqual(all);
});

it('records the instructions GCC chose for each ordering', () => {
  const listing = (name: string) =>
    readFileSync(
      `labs/computer-architecture-execution/multicore/${name}.txt`,
      'utf8',
    );
  const instructions = (name: string) =>
    listing(name)
      .split('\n')
      .filter((l) => /^\t[a-z]/.test(l) && !l.startsWith('\t.'))
      .map((l) => l.trim().split(/\s+/)[0]);
  // x86-64: release and acquire are ordinary moves; seq_cst and the RMW are not.
  expect(instructions('publish-O2')).toEqual([
    'endbr64',
    'movl',
    'movl',
    'ret',
  ]);
  expect(instructions('consume-O2')).not.toContain('mfence');
  expect(instructions('publish_seq_cst-O2')).toContain('xchgl');
  expect(listing('count_hit-O2')).toMatch(/lock addl\t\$1, hits\(%rip\)/);
  // AArch64: store-release and load-acquire instructions.
  expect(instructions('publish-arm64-O2')).toContain('stlr');
  expect(instructions('consume-arm64-O2')).toContain('ldar');
});

it('loses an increment unless the read-modify-write is atomic', () => {
  expect(lostUpdate(false).map((o) => [o.final, o.executions])).toEqual([
    [8, 18],
    [9, 2],
  ]);
  expect(lostUpdate(true)).toEqual([
    { final: 9, executions: 2, example: ['A fetch_add', 'B fetch_add'] },
  ]);
  expect(lostUpdate(false)[0]!.example).toEqual([
    'A load',
    'A add',
    'B load',
    'A store',
    'B add',
    'B store',
  ]);
});

it('reads the recorded false-sharing measurement', () => {
  const data = JSON.parse(
    readFileSync(
      'labs/computer-architecture-execution/multicore/false-sharing.json',
      'utf8',
    ),
  );
  const median = (layout: string) => {
    const v = data.records
      .filter((r: { layout: string }) => r.layout === layout)
      .map((r: { nsPerIncrement: number }) => r.nsPerIncrement)
      .sort((a: number, b: number) => a - b);
    return v[v.length >> 1];
  };
  expect(data.records).toHaveLength(14);
  expect(
    data.records.every((r: { iterations: number }) => r.iterations === 1e8),
  ).toBe(true);
  // The recorded run: sharing a line made each increment several times slower.
  expect(median('adjacent') / median('padded')).toBeGreaterThan(3);
});

it('prints the lesson output', () => {
  expect(multicoreExample()).toBe(
    [
      'MESI: EI → SS → MI → SS',
      '8 alternating writes: 8 ownership requests on one line, 2 padded',
      'relaxed: r1=0, r2=0 | r1=0, r2=42 | r1=1, r2=0 | r1=1, r2=42',
      'release/acquire: r1=0, r2=0 | r1=0, r2=42 | r1=1, r2=42',
      'counter: plain 8 or 9, atomic 9',
    ].join('\n'),
  );
});

it('parses access tokens and refuses any other', () => {
  expect(parseAccesses(' Ar  Bw ')).toEqual([
    { core: 0, op: 'read' },
    { core: 1, op: 'write' },
  ]);
  expect(parseAccesses('')).toEqual([]);
  for (const bad of ['Cr', 'Ax', 'ar', 'Arw', 'A'])
    expect(() => parseAccesses(bad)).toThrow(RangeError);
  expect(
    mesi(parseAccesses('Br Bw Ar Aw')).map((s) => s.after.join('')),
  ).toEqual(['IE', 'IM', 'SS', 'MI']);
});
