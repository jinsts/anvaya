type Frame = { name: string; bytes: number };

// Bookkeeping for explicit lifetimes; this does not inspect the JS call stack.
export class LifetimeModel {
  private frames: Frame[] = [];
  private allocations = new Map<number, number>();
  private nextId = 1;

  constructor(private readonly stackLimit: number) {
    if (!Number.isSafeInteger(stackLimit) || stackLimit <= 0) {
      throw new RangeError('Expected a positive stack limit.');
    }
  }

  get stackBytes(): number {
    return this.frames.reduce((total, frame) => total + frame.bytes, 0);
  }

  get heapBytes(): number {
    return [...this.allocations.values()].reduce(
      (total, size) => total + size,
      0,
    );
  }

  enter(name: string, bytes: number): void {
    if (!name.trim() || !Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new RangeError('Expected a frame name and positive byte count.');
    }
    if (bytes > this.stackLimit - this.stackBytes) {
      throw new RangeError('Model stack overflow.');
    }
    this.frames.push({ name, bytes });
  }

  leave(): string {
    const frame = this.frames.pop();
    if (!frame) throw new RangeError('No frame to return from.');
    return frame.name;
  }

  allocate(bytes: number): number {
    if (!Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new RangeError('Expected a positive allocation size.');
    }
    if (bytes > Number.MAX_SAFE_INTEGER - this.heapBytes) {
      throw new RangeError(
        'Model heap byte count exceeds the safe integer range.',
      );
    }
    if (!Number.isSafeInteger(this.nextId)) {
      throw new RangeError('Model allocation identifiers exhausted.');
    }
    const id = this.nextId++;
    this.allocations.set(id, bytes);
    return id;
  }

  free(id: number): void {
    if (!this.allocations.delete(id)) {
      throw new RangeError('Unknown or already freed allocation.');
    }
  }
}

export function lifetimeExample(): string {
  const memory = new LifetimeModel(64);
  memory.enter('main', 16);
  memory.enter('makeBuffer', 24);
  const buffer = memory.allocate(128);
  const during = `during call: stack=${memory.stackBytes}, heap=${memory.heapBytes}`;
  memory.leave();
  const after = `after return: stack=${memory.stackBytes}, heap=${memory.heapBytes}`;
  memory.free(buffer);
  return `${during}\n${after}\nafter free: heap=${memory.heapBytes}`;
}
