import { cpuSeconds } from './example';
import { contracts } from './contracts';
contracts(
  (baseline, candidate) =>
    cpuSeconds(baseline.instructions, baseline.cpi, baseline.hz) /
    cpuSeconds(candidate.instructions, candidate.cpi, candidate.hz),
);
