/**
 * TODO: The tested reference model the lesson teaches from. Its figures
 * import it, so state its assumptions here.
 */
export function total(values: readonly number[]): number {
  if (values.some((value) => !Number.isFinite(value)))
    throw new RangeError('Every value must be finite');
  return values.reduce((sum, value) => sum + value, 0);
}

/** The output the lesson shows in its tested model disclosure. */
export function totalExample(): string {
  return [[1, 2, 3], []]
    .map((values) => `total(${JSON.stringify(values)}) = ${total(values)}`)
    .join('\n');
}
