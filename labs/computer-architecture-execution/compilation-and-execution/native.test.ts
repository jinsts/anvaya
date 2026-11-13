import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
it.skipIf(!process.env.ANVAYA_CC)(
  'compiles and executes both optimization levels and validates locality checksums',
  () => {
    const output = execFileSync(
      process.execPath,
      [
        'labs/computer-architecture-execution/compilation-and-execution/native/verify-native.mjs',
      ],
      { encoding: 'utf8' },
    );
    const report = JSON.parse(output);
    expect(report.records).toHaveLength(12);
    expect(
      new Set(report.records.map((r: { checksum: string }) => r.checksum)).size,
    ).toBe(1);
  },
);
