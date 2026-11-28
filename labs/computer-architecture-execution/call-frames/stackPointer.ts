// How one x86-64 function moves the stack pointer, measured as its depth: the
// bytes below rsp's value at entry, just after the caller's call pushed the
// return address. The System V psABI wants rsp + 8 to be a multiple of 16 at
// entry, so a call made from this function is aligned when depth − 8 is a
// multiple of 16. A teaching model of the stack-pointer rules only: it tracks
// no values, and a call stands for a callee that returns with the stack as it
// found it.
import { parseListing, type Listing } from '../reading-assembly/x86';

/** push, pop, sub N, add N, frame (movq %rsp, %rbp), leave, call, ret. */
export type StackEvent = string;

const amount = (event: string, word: string): number | null => {
  const match = new RegExp(`^${word} (\\S+)$`).exec(event);
  if (!match) return null;
  const bytes = Number(match[1]);
  if (!Number.isSafeInteger(bytes) || bytes < 0)
    throw new RangeError(`${event}: a byte count is a nonnegative integer.`);
  return bytes;
};

/** The depth after each event, or a RangeError at the first broken rule. */
export function trackStack(events: readonly StackEvent[]): number[] {
  let depth = 0;
  let frameBase: number | null = null;
  let returned = false;
  const below = (next: number, event: string) => {
    if (next < 0)
      throw new RangeError(`${event} would move rsp above its entry value.`);
    return next;
  };
  return events.map((event) => {
    if (returned)
      throw new RangeError(`${event} after ret: the frame is gone.`);
    const sub = amount(event, 'sub');
    const add = amount(event, 'add');
    if (event === 'push') depth += 8;
    else if (event === 'pop') depth = below(depth - 8, event);
    else if (sub !== null) depth += sub;
    else if (add !== null) depth = below(depth - add, event);
    else if (event === 'frame') frameBase = depth;
    else if (event === 'leave') {
      if (frameBase === null)
        throw new RangeError('leave without a frame: rbp was never set here.');
      // rsp = rbp, then pop the saved rbp.
      depth = below(frameBase - 8, event);
      frameBase = null;
    } else if (event === 'call') {
      if ((depth - 8) % 16 !== 0)
        throw new RangeError(
          `call at depth ${depth}: rsp is not 16-byte aligned at the call.`,
        );
    } else if (event === 'ret') {
      if (depth !== 0)
        throw new RangeError(`ret at depth ${depth}: the frame is not popped.`);
      returned = true;
    } else throw new RangeError(`Unknown stack event: ${event}`);
    return depth;
  });
}

/** A GCC listing's instructions that move rsp, each with its stack event, in
 * program order. They form one valid trace only when every path runs the same
 * stack instructions, as in this subject's -O0 functions and -O2 scale_sum. */
export function stackSteps(
  listing: Listing,
): { text: string; event: StackEvent }[] {
  const steps: { text: string; event: StackEvent }[] = [];
  for (const { mnemonic, operands, text } of listing.instructions) {
    const [source, target] = operands;
    const rsp = target?.kind === 'reg' && target.reg === 'rsp';
    let event: StackEvent | null = null;
    if (mnemonic === 'pushq') event = 'push';
    else if (mnemonic === 'popq') event = 'pop';
    else if (mnemonic === 'call') event = 'call';
    else if (mnemonic === 'ret') event = 'ret';
    else if (mnemonic === 'leave') event = 'leave';
    else if ((mnemonic === 'subq' || mnemonic === 'addq') && rsp) {
      if (source?.kind !== 'imm') throw new Error('Expected a constant');
      event = `${mnemonic.slice(0, 3)} ${source.value}`;
    } else if (
      mnemonic === 'movq' &&
      source?.kind === 'reg' &&
      source.reg === 'rsp' &&
      target?.kind === 'reg' &&
      target.reg === 'rbp'
    )
      event = 'frame';
    if (event) steps.push({ text, event });
  }
  return steps;
}

/** The stack events of a GCC listing, in program order. */
export function stackEvents(listing: Listing): StackEvent[] {
  return stackSteps(listing).map((step) => step.event);
}

/** Nested calls of one frame size that fit in a stack of `stackBytes`. */
export function maxDepth(frameBytes: number, stackBytes: number): number {
  for (const value of [frameBytes, stackBytes])
    if (!Number.isSafeInteger(value) || value < 1)
      throw new RangeError('Sizes must be positive integers of bytes.');
  return Math.floor(stackBytes / frameBytes);
}

/** Each event with the depth after it, as the lesson and its figure show. */
export function describeStack(listing: Listing, label: string): string {
  const events = stackEvents(listing);
  const depths = trackStack(events);
  return `${listing.name} ${label}: ${events.map((e, i) => `${e} → ${depths[i]}`).join(', ')}`;
}

/** The three single-path listings the lesson traces, from their committed text. */
export function framesExample(listings: {
  scaleO0: string;
  scaleO2: string;
  sumO0: string;
}): string {
  return [
    describeStack(parseListing(listings.scaleO0), '-O0'),
    describeStack(parseListing(listings.scaleO2), '-O2'),
    describeStack(parseListing(listings.sumO0), '-O0'),
  ].join('\n');
}
