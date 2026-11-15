import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
// Needs a C compiler; see native/README.md. Without ANVAYA_CC the test is
// skipped, and the quality gate reports it as skipped.
it.skipIf(!process.env.ANVAYA_CC)(
  'compiles and checks the native programs, finds no artifact drift and validates measurements',
  () => {
    const output = execFileSync(
      process.execPath,
      [
        'labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs',
      ],
      { encoding: 'utf8' },
    );
    const report = JSON.parse(output);
    const statuses = report.drift.map((d: { status: string }) => d.status);
    expect(statuses).not.toContain('changed');
    // Artifacts are compared only with the recorded compiler version.
    if (statuses.includes('skipped'))
      console.warn('Native drift check skipped: compiler version differs.');
    for (const measurement of report.measurements)
      expect(measurement.caches ?? '').toMatch(/L1d|^$/);
    const locality = report.measurements.find(
      (m: { file: string }) =>
        m.file === 'architecture-and-performance/measurement.json',
    );
    expect(locality.records).toHaveLength(12);
  },
  120_000,
);
