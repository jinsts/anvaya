// Native lab for Operating Systems & Runtime Internals, registered with the
// shared native runner (scripts/native.ts, ADR 0010). Lessons add their C
// programs, traces, JVM and Go artifacts and measurements here; README.md
// says how to set up each toolchain. From the repository root:
//
//   node labs/operating-systems-runtime-internals/native/registry.ts
//
// with ANVAYA_CC, ANVAYA_BINUTILS, ANVAYA_STRACE, ANVAYA_JAVA_HOME, ANVAYA_GO
// and ANVAYA_DOCKER set for the tools you have; the rest are skipped.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  main,
  type Artifact,
  type Check,
  type Measurement,
  type Registry,
} from '../../../scripts/native.ts';

const directory = dirname(fileURLToPath(import.meta.url));

export const CHECKS: Check[] = [];
export const ARTIFACTS: Artifact[] = [];
export const MEASUREMENTS: Measurement[] = [];

export const REGISTRY: Registry = {
  root: resolve(directory, '..'),
  toolchainFile: join(directory, 'toolchain.json'),
  checks: CHECKS,
  artifacts: ARTIFACTS,
  measurements: MEASUREMENTS,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main(REGISTRY);
