// Arithmetic estimates for a fixed workload, not measured execution timings.
function positive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite.`);
  }
}

export function cpuSeconds(
  instructions: number,
  cyclesPerInstruction: number,
  frequencyHz: number,
): number {
  if (!Number.isSafeInteger(instructions) || instructions < 0) {
    throw new RangeError(
      'Instruction count must be a nonnegative safe integer.',
    );
  }
  positive(cyclesPerInstruction, 'CPI');
  positive(frequencyHz, 'Frequency');
  const seconds = (instructions / frequencyHz) * cyclesPerInstruction;
  if (!Number.isFinite(seconds)) throw new RangeError('Estimate is too large.');
  return seconds;
}

export function amdahl(
  serialFraction: number,
  parallelSpeedup: number,
): number {
  if (
    !Number.isFinite(serialFraction) ||
    serialFraction < 0 ||
    serialFraction > 1
  ) {
    throw new RangeError('Serial fraction must be between zero and one.');
  }
  positive(parallelSpeedup, 'Parallel speedup');
  const speedup = 1 / (serialFraction + (1 - serialFraction) / parallelSpeedup);
  if (!Number.isFinite(speedup)) throw new RangeError('Speedup is too large.');
  return speedup;
}

export function performanceExample(): string {
  const baseline = cpuSeconds(2_000_000_000, 1.5, 3_000_000_000);
  const candidate = cpuSeconds(1_500_000_000, 1.8, 3_000_000_000);
  return [
    `baseline: ${baseline.toFixed(3)} s`,
    `candidate: ${candidate.toFixed(3)} s`,
    `speedup: ${(baseline / candidate).toFixed(3)}x`,
    `25% serial, 4x parallel: ${amdahl(0.25, 4).toFixed(3)}x`,
  ].join('\n');
}
