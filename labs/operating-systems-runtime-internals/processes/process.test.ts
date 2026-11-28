import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LAUNCHER,
  LIFECYCLE,
  processesExample,
  simulate,
  type Action,
} from './process';

const dir = 'labs/operating-systems-runtime-internals/processes';
const ends = (program: Action[]) =>
  simulate(program).processes.map((p) => [p.name, p.status, p.end]);

describe('fork, exec, exit and wait', () => {
  it('runs the launcher to the same ends launcher.c recorded', () => {
    // The independent check: launcher.c ran these steps on Linux.
    const recorded = readFileSync(`${dir}/launcher-output.txt`, 'utf8');
    const { processes } = simulate(LAUNCHER);
    for (const name of ['P2', 'P3', 'P4']) {
      const status = processes.find((p) => p.name === name)!.status;
      expect(recorded).toContain(
        `P1 reaps ${name}: exited with status ${status}`,
      );
    }
    expect(recorded).toContain('serve: ok, 11 bytes');
    expect(processes.find((p) => p.name === 'P2')!.image).toBe('serve');
    // A failed exec returns, and the code after it runs.
    expect(recorded).toContain('so P3 runs on and exits with 127');
    // Every exited child is a zombie until it is reaped.
    expect(recorded).toContain('/proc/P3/stat shows Z');
    expect(recorded).toContain('/proc/P3 is gone');
    // P5 outlived its parent. The model gives it to init; launcher.c, a
    // subreaper, took it in init's place.
    expect(processes.find((p) => p.name === 'P5')).toMatchObject({
      parent: 'P4',
      status: 0,
      end: 'reaped by init',
    });
    expect(recorded).toContain("P5's new parent was P1");
  });

  it('never runs code after a successful exec and keeps going after a failed one', () => {
    expect(
      ends([
        { fork: [{ exec: 'sort', exits: 0 }, { exit: 9 }] },
        { wait: true },
      ]),
    ).toEqual([
      ['P1', 0, 'reaped by parent'],
      ['P2', 0, 'reaped by parent'],
    ]);
    expect(
      simulate([{ fork: [{ exec: 'nope' }, { exit: 9 }] }, { wait: true }])
        .processes[1],
    ).toMatchObject({
      image: 'program',
      status: 9,
    });
  });

  it('leaves a zombie while its parent lives without waiting', () => {
    expect(ends([{ fork: [{ exit: 3 }] }, { pause: true }])).toEqual([
      ['P1', null, 'running'],
      ['P2', 3, 'zombie'],
    ]);
    const states = simulate([
      { fork: [{ exit: 3 }] },
      { wait: true },
    ]).events.map(
      (e) => `${e.kind}:${e.after.find((s) => s.name === 'P2')?.state ?? '-'}`,
    );
    expect(states).toContain('exit:zombie');
    expect(states).toContain('reap:reaped');
  });

  it('gives an orphan to init, and blocks a waiter whose child never exits', () => {
    expect(ends([{ fork: [{ fork: [{ exit: 6 }] }] }, { wait: true }])).toEqual(
      [
        ['P1', 0, 'reaped by parent'],
        ['P2', 0, 'reaped by parent'],
        ['P3', 6, 'reaped by init'],
      ],
    );
    expect(
      ends([{ fork: [{ pause: true }] }, { wait: true }, { exit: 1 }]),
    ).toEqual([
      ['P1', null, 'running'],
      ['P2', null, 'running'],
    ]);
    expect(ends([{ wait: true }, { exit: 3 }])).toEqual([
      ['P1', 3, 'reaped by parent'],
    ]);
  });

  it('names children in reading order, whatever the scheduler does', () => {
    const { processes } = simulate([
      { fork: [{ fork: [] }, { wait: true }] },
      { fork: [] },
      { wait: true },
      { wait: true },
    ]);
    expect(processes.map((p) => [p.name, p.parent])).toEqual([
      ['P1', null],
      ['P2', 'P1'],
      ['P3', 'P2'],
      ['P4', 'P1'],
    ]);
  });

  it('refuses statuses outside 0–255 and anything that is not an action', () => {
    expect(() => simulate([{ exit: 256 }])).toThrow(
      new RangeError('An exit status must be an integer from 0 to 255'),
    );
    expect(() => simulate([{ fork: [{ exec: 'x', exits: -1 }] }])).toThrow(
      RangeError,
    );
    expect(() => simulate([{ spawn: 'x' } as unknown as Action])).toThrow(
      TypeError,
    );
  });

  it('draws the lifecycle the simulation follows', () => {
    expect(LIFECYCLE.map((t) => t.to)).toEqual([
      'running',
      'running',
      'zombie',
      'reaped',
      'reaped',
    ]);
    const kinds = new Set(simulate(LAUNCHER).events.map((e) => e.kind));
    for (const kind of ['fork', 'exec', 'exit', 'reap', 'adopt'] as const)
      expect(kinds).toContain(kind);
  });
});

it('answers the lesson’s practice prediction', () => {
  // Practice 01: P1 waits once, so it reaps only its oldest child.
  expect(
    ends([
      { fork: [{ exec: 'serve', exits: 0 }] },
      { fork: [{ exit: 2 }] },
      { wait: true },
    ]),
  ).toEqual([
    ['P1', 0, 'reaped by parent'],
    ['P2', 0, 'reaped by parent'],
    ['P3', 2, 'reaped by init'],
  ]);
});

it('prints the lesson output', () => {
  expect(processesExample()).toBe(
    [
      'P1 program status 0: reaped by parent',
      'P2 serve status 0: reaped by parent',
      'P3 program status 127: reaped by parent',
      'P4 program status 0: reaped by parent',
      'P5 program status 0: reaped by init',
      'with a parent that never waits: P1 running, P2 zombie',
    ].join('\n'),
  );
});
