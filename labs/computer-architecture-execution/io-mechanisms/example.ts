// Educational DMA receive-buffer ownership model; no device or I/O is accessed.
export type Request = Readonly<{
  phase: 'ready' | 'in-flight' | 'completed' | 'failed';
  capacity: number;
  transferred: number;
}>;
export type Event =
  | { type: 'submit' }
  | { type: 'complete'; bytes: number }
  | { type: 'fail' }
  | { type: 'reclaim' };

function byteCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Byte counts must be nonnegative safe integers.');
  }
}

export function owner(request: Request): 'host' | 'device' {
  return request.phase === 'ready' ? 'host' : 'device';
}

export function advance(request: Request, event: Event): Request {
  byteCount(request.capacity);
  byteCount(request.transferred);
  if (request.transferred > request.capacity) {
    throw new RangeError('Transferred bytes cannot exceed capacity.');
  }
  if (event.type === 'submit' && request.phase === 'ready') {
    return { ...request, phase: 'in-flight', transferred: 0 };
  }
  if (event.type === 'complete' && request.phase === 'in-flight') {
    byteCount(event.bytes);
    if (event.bytes > request.capacity) {
      throw new RangeError('The device cannot fill beyond the buffer.');
    }
    return { ...request, phase: 'completed', transferred: event.bytes };
  }
  if (event.type === 'fail' && request.phase === 'in-flight') {
    return { ...request, phase: 'failed', transferred: 0 };
  }
  if (
    event.type === 'reclaim' &&
    (request.phase === 'completed' || request.phase === 'failed')
  ) {
    // Stands for driver acknowledgement and any required DMA synchronization.
    return { ...request, phase: 'ready' };
  }
  throw new Error(`Cannot ${event.type} a ${request.phase} request.`);
}

export function ioExample(): string {
  const ready: Request = { phase: 'ready', capacity: 8, transferred: 0 };
  const submitted = advance(ready, { type: 'submit' });
  const completed = advance(submitted, { type: 'complete', bytes: 4 });
  const reclaimed = advance(completed, { type: 'reclaim' });
  return [
    `submitted: ${owner(submitted)}`,
    `completed: ${owner(completed)}`,
    `reclaimed: ${owner(reclaimed)} (${reclaimed.transferred} bytes)`,
  ].join('\n');
}

/** When a poll every `interval` time units, starting at `interval`, first sees
 * a device that became ready at `readyAt`. Illustrative units, not a device. */
export function pollingDetection(readyAt: number, interval: number) {
  if (!Number.isFinite(readyAt) || readyAt < 0) {
    throw new RangeError('The ready time must be a nonnegative number.');
  }
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new RangeError('The polling interval must be positive.');
  }
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
  if (!Number.isFinite(readyAt) || readyAt < 0) {
    throw new RangeError('The ready time must be a nonnegative number.');
  }
  return { checks: 0, handlerEntries: 1, detectedAt: readyAt, delay: 0 };
}
