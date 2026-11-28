// How software learns that a device finished, and who moves the bytes. A
// teaching model in illustrative time units, not a measurement of any device:
// a poll or a handler entry is instantaneous, polls start at time `interval`
// and stop once every expected completion is found, and moving one word takes
// one unit.

function checkTime(value: number, what: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${what} must be a nonnegative number.`);
}

function checkInterval(interval: number): void {
  if (!Number.isFinite(interval) || interval <= 0)
    throw new RangeError('The polling interval must be positive.');
}

/** When a poll every `interval` time units, starting at `interval`, first sees
 * a device that became ready at `readyAt`. */
export function pollingDetection(readyAt: number, interval: number) {
  checkTime(readyAt, 'The ready time');
  checkInterval(interval);
  const checks = Math.max(1, Math.ceil(readyAt / interval));
  const checkTimes = Array.from(
    { length: checks },
    (_, i) => (i + 1) * interval,
  );
  const detectedAt = checkTimes[checks - 1]!;
  return { checkTimes, checks, detectedAt, delay: detectedAt - readyAt };
}

/** An interrupt is raised when the device becomes ready: no checks, one entry. */
export function interruptDetection(readyAt: number) {
  checkTime(readyAt, 'The ready time');
  return { checks: 0, handlerEntries: 1, detectedAt: readyAt, delay: 0 };
}

export interface Detection {
  /** Status checks made by the CPU. */
  checks: number;
  /** Checks that found no new completion. */
  emptyChecks: number;
  /** Times the CPU entered an interrupt handler. */
  handlerEntries: number;
  /** For each completion, in input order: time found minus time ready. */
  delays: number[];
}

/** Poll every `interval` from `interval` on, until every completion is found. */
export function pollCompletions(
  readyTimes: readonly number[],
  interval: number,
): Detection {
  checkInterval(interval);
  for (const t of readyTimes) checkTime(t, 'A ready time');
  const foundAt = readyTimes.map(
    (t) => Math.max(1, Math.ceil(t / interval)) * interval,
  );
  const checks = foundAt.length ? Math.max(...foundAt) / interval : 0;
  const productive = new Set(foundAt).size;
  return {
    checks,
    emptyChecks: checks - productive,
    handlerEntries: 0,
    delays: foundAt.map((f, i) => f - readyTimes[i]!),
  };
}

/** One interrupt for every completion, delivered when it happens. */
export function interruptEach(readyTimes: readonly number[]): Detection {
  for (const t of readyTimes) checkTime(t, 'A ready time');
  return {
    checks: 0,
    emptyChecks: 0,
    handlerEntries: readyTimes.length,
    delays: readyTimes.map(() => 0),
  };
}

/** Coalesced interrupts: the device raises one interrupt when `batch`
 * completions are waiting, or `timeout` units after the oldest waiting one,
 * whichever comes first, and the handler takes every waiting completion. */
export function coalescedInterrupts(
  readyTimes: readonly number[],
  batch: number,
  timeout: number,
): Detection {
  if (!Number.isSafeInteger(batch) || batch < 1)
    throw new RangeError(
      'A batch is a whole number of completions, at least 1.',
    );
  checkTime(timeout, 'The timeout');
  for (const t of readyTimes) checkTime(t, 'A ready time');
  const order = readyTimes
    .map((t, i) => ({ t, i }))
    .sort((a, b) => a.t - b.t || a.i - b.i);
  const delays = Array<number>(readyTimes.length).fill(0);
  let handlerEntries = 0;
  let next = 0;
  while (next < order.length) {
    const deadline = order[next]!.t + timeout;
    // The batch fills when its batch-th completion arrives, if before the deadline.
    const filling = order[next + batch - 1];
    const fireAt = filling && filling.t <= deadline ? filling.t : deadline;
    handlerEntries += 1;
    while (next < order.length && order[next]!.t <= fireAt) {
      delays[order[next]!.i] = fireAt - order[next]!.t;
      next += 1;
    }
  }
  return { checks: 0, emptyChecks: 0, handlerEntries, delays };
}

export type Slot = 'setup' | 'copy' | 'free' | 'interrupt';

/** What the CPU does in each unit while `words` move to a device. With
 * programmed I/O it copies each word itself; with DMA it programs the engine,
 * is free while the engine copies, then handles the completion interrupt. */
export function transferTimeline(words: number, mechanism: 'pio' | 'dma') {
  if (!Number.isSafeInteger(words) || words < 1)
    throw new RangeError('A transfer moves at least one whole word.');
  const cpu: Slot[] =
    mechanism === 'pio'
      ? ['setup', ...Array<Slot>(words).fill('copy')]
      : ['setup', ...Array<Slot>(words).fill('free'), 'interrupt'];
  const engine: ('copy' | 'idle')[] =
    mechanism === 'pio'
      ? cpu.map(() => 'idle')
      : cpu.map((slot) => (slot === 'free' ? 'copy' : 'idle'));
  return {
    cpu,
    engine,
    cpuBusy: cpu.filter((slot) => slot !== 'free').length,
  };
}

/** The lesson's burst: five completions arriving one unit apart. */
export const BURST = [9, 10, 11, 12, 13] as const;

export function notificationExample(): string {
  const one = pollingDetection(10, 4);
  const poll = pollCompletions(BURST, 4);
  const each = interruptEach(BURST);
  const coalesced = coalescedInterrupts(BURST, 3, 4);
  const pio = transferTimeline(8, 'pio');
  const dma = transferTimeline(8, 'dma');
  return [
    `ready at 10, poll every 4: found at ${one.detectedAt} after ${one.checks} checks`,
    `burst, poll every 4: ${poll.checks} checks (${poll.emptyChecks} empty), delays ${poll.delays.join(' ')}`,
    `burst, interrupt each: ${each.handlerEntries} handler entries, delays ${each.delays.join(' ')}`,
    `burst, coalesce 3 or 4 units: ${coalesced.handlerEntries} handler entries, delays ${coalesced.delays.join(' ')}`,
    `8 words: CPU busy ${pio.cpuBusy} units with PIO, ${dma.cpuBusy} with DMA`,
  ].join('\n');
}
