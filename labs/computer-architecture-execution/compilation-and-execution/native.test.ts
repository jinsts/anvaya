import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
// Needs a C compiler; see native/README.md. Without ANVAYA_CC the test is
// skipped, and the quality gate reports it as skipped. Set ANVAYA_BINUTILS and
// ANVAYA_CC_ARM64 too, or the artifacts that need them are skipped.
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
    const drift: { status: string; reason?: string }[] = report.drift;
    expect(drift.map((d) => d.status)).not.toContain('changed');
    // Artifacts are compared only with the recorded tool versions; the
    // shared runner (scripts/native.ts) gives the reason for each skip.
    const skipped = drift.filter((d) => d.status === 'skipped');
    if (skipped.length)
      console.warn(
        `Native drift check skipped ${skipped.length} artifact(s): ${skipped[0]!.reason}`,
      );
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
