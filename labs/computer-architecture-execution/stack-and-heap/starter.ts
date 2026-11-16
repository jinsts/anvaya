import type { LifetimeEvent } from './trace';
// Implement the contract before consulting trace.ts.
export function solve(events: LifetimeEvent[]): {
  live: number[];
  dangling: string[];
} {
  void events;
  throw new Error('Implement your attempt');
}
