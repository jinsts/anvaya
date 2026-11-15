// Frames with named local slots, heap objects and the handles between them,
// recorded after every event. LifetimeModel enforces the stack limit, LIFO
// returns and single release; this layer adds the locals so a figure can draw
// which slot refers to which object. Handles are model numbers, not addresses.
import { LifetimeModel } from './example';

export type LifetimeEvent =
  | {
      kind: 'call';
      frame: string;
      bytes: number;
      locals: string[];
      /** Callee local ← caller local: an argument copied at the call. */
      pass?: Record<string, string>;
    }
  | { kind: 'allocate'; bytes: number; into: string }
  /** Pop the top frame, optionally copying one of its locals into the caller. */
  | { kind: 'return'; value?: string; into?: string }
  | { kind: 'free'; local: string }
  | { kind: 'clear'; local: string };

export interface FrameView {
  name: string;
  bytes: number;
  locals: { name: string; ref: number | null }[];
}
export interface Snapshot {
  frames: FrameView[];
  heap: { id: number; bytes: number; live: boolean }[];
  stackBytes: number;
  heapBytes: number;
}

export function traceLifetimes(
  events: readonly LifetimeEvent[],
  stackLimit: number,
): Snapshot[] {
  const model = new LifetimeModel(stackLimit);
  const frames: FrameView[] = [];
  const heap: Snapshot['heap'] = [];
  const top = () => {
    const frame = frames.at(-1);
    if (!frame) throw new RangeError('No active frame.');
    return frame;
  };
  const slot = (frame: FrameView, name: string) => {
    const local = frame.locals.find((l) => l.name === name);
    if (!local) throw new RangeError(`${frame.name} has no local ${name}.`);
    return local;
  };
  const snapshot = (): Snapshot => ({
    frames: frames.map((f) => ({
      ...f,
      locals: f.locals.map((l) => ({ ...l })),
    })),
    heap: heap.map((h) => ({ ...h })),
    stackBytes: model.stackBytes,
    heapBytes: model.heapBytes,
  });
  const snapshots = [snapshot()];
  for (const event of events) {
    if (event.kind === 'call') {
      const caller = frames.at(-1);
      const passed = Object.entries(event.pass ?? {}).map(([to, from]) => {
        if (!caller) throw new RangeError('Nothing to pass arguments from.');
        return [to, slot(caller, from).ref] as const;
      });
      model.enter(event.frame, event.bytes);
      const frame: FrameView = {
        name: event.frame,
        bytes: event.bytes,
        locals: event.locals.map((name) => ({ name, ref: null })),
      };
      for (const [to, ref] of passed) slot(frame, to).ref = ref;
      frames.push(frame);
    } else if (event.kind === 'allocate') {
      const local = slot(top(), event.into);
      const id = model.allocate(event.bytes);
      heap.push({ id, bytes: event.bytes, live: true });
      local.ref = id;
    } else if (event.kind === 'return') {
      const callee = top();
      const value = event.value ? slot(callee, event.value).ref : null;
      model.leave();
      frames.pop();
      if (event.into) slot(top(), event.into).ref = value;
    } else if (event.kind === 'free') {
      const local = slot(top(), event.local);
      if (local.ref === null)
        throw new RangeError(`${event.local} holds no handle.`);
      model.free(local.ref);
      heap.find((h) => h.id === local.ref)!.live = false;
    } else {
      slot(top(), event.local).ref = null;
    }
    snapshots.push(snapshot());
  }
  return snapshots;
}

/** After the events: allocated object ids, and frame.local names that hold a
 *  handle to a freed object. */
export function lifetimeReport(
  events: readonly LifetimeEvent[],
  stackLimit = 1024,
) {
  const last = traceLifetimes(events, stackLimit).at(-1)!;
  const freed = new Set(last.heap.filter((h) => !h.live).map((h) => h.id));
  return {
    live: last.heap.filter((h) => h.live).map((h) => h.id),
    dangling: last.frames.flatMap((f) =>
      f.locals
        .filter((l) => l.ref !== null && freed.has(l.ref))
        .map((l) => `${f.name}.${l.name}`),
    ),
  };
}

export interface StoryStep {
  event: LifetimeEvent;
  says: string;
  question?: { prompt: string; options: string[]; answer: number; why: string };
}

/** The lesson's story: a callee creates a buffer that outlives its frame. */
export const STORY: StoryStep[] = [
  {
    event: { kind: 'call', frame: 'main', bytes: 16, locals: ['data'] },
    says: 'main starts with one local, data, that does not refer to anything yet.',
  },
  {
    event: { kind: 'call', frame: 'makeBuffer', bytes: 24, locals: ['buf'] },
    says: 'main calls makeBuffer: a new frame goes on top of the stack.',
  },
  {
    event: { kind: 'allocate', bytes: 128, into: 'buf' },
    says: 'makeBuffer allocates 128 bytes on the heap and keeps the handle in its local buf.',
  },
  {
    event: { kind: 'return', value: 'buf', into: 'data' },
    says: 'makeBuffer returns the handle. Its frame and its local buf are gone; main’s data now refers to the buffer.',
    question: {
      prompt:
        'When makeBuffer’s frame is removed, what happens to the 128-byte buffer?',
      options: ['It stays allocated', 'It is freed with the frame'],
      answer: 0,
      why: 'Only the frame and its copy of the handle are removed. The buffer has its own lifetime and is still reachable through data.',
    },
  },
  {
    event: { kind: 'free', local: 'data' },
    says: 'main frees the buffer. The allocation is released, but data still holds the old handle.',
    question: {
      prompt: 'After free(data), what does data hold?',
      options: ['The same handle, now dangling', 'Nothing: free clears it'],
      answer: 0,
      why: 'free releases the allocation; it cannot reach the variables that named it. Using data now would be a use-after-free.',
    },
  },
  {
    event: { kind: 'clear', local: 'data' },
    says: 'Clearing data removes the dangling handle, so a later mistake fails visibly instead of touching reused memory.',
  },
  {
    event: { kind: 'return' },
    says: 'main returns. Every frame is gone and nothing is left allocated.',
  },
];
export const STORY_STACK_LIMIT = 64;
