import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Report } from '../../../scripts/native.ts';
// Runs this subject's native registry with whichever toolchains are set (see
// README.md). A tool whose variable is unset has its test skipped here, and
// the runner reports everything that needs it as skipped, with the reason.
// Artifacts are compared only with the recorded tool versions.
const VARIABLES = {
  cc: 'ANVAYA_CC',
  strace: 'ANVAYA_STRACE',
  java: 'ANVAYA_JAVA_HOME',
  go: 'ANVAYA_GO',
  docker: 'ANVAYA_DOCKER',
} as const;
const anyTool = Object.values(VARIABLES).some((name) => process.env[name]);

describe.skipIf(!anyTool)('native lab', () => {
  let report: Report;
  beforeAll(() => {
    report = JSON.parse(
      execFileSync(
        process.execPath,
        ['labs/operating-systems-runtime-internals/native/registry.ts'],
        { encoding: 'utf8', maxBuffer: 64 << 20 },
      ),
    );
  }, 600_000);

  it('finds no artifact drift', () => {
    expect(report.drift.filter((d) => d.status === 'changed')).toEqual([]);
    const skipped = report.drift.filter((d) => d.status === 'skipped');
    if (skipped.length)
      console.warn(
        `Native drift check skipped ${skipped.length} artifact(s): ${skipped[0]!.reason}`,
      );
  });

  for (const [tool, variable] of Object.entries(VARIABLES))
    it.skipIf(!process.env[variable])(
      `runs everything that needs ${tool}`,
      () => {
        expect(report.tools[tool as keyof typeof VARIABLES].status).toBe(
          'present',
        );
        expect(
          report.skipped.filter((s) => s.reason.includes(`${tool} is absent`)),
        ).toEqual([]);
      },
    );
});
